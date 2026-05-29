from flask import Blueprint, render_template, redirect, url_for, request, flash, session
from flask_login import login_required, current_user, login_user, logout_user
from models import db, User, Product, Order, OrderItem

main = Blueprint('main', __name__)

# --- Authentication Routes ---

@main.route('/')
def index():
    return render_template('index.html')

@main.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        role = request.form.get('role')
        location = request.form.get('location')

        if User.query.filter_by(username=username).first():
            flash('Username already exists!', 'error')
            return redirect(url_for('main.register'))

        new_user = User(username=username, role=role, location=location)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        
        flash('Registration Successful! Please Login.', 'success')
        return redirect(url_for('main.login'))
    
    return render_template('register.html')

@main.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()

        if user and user.check_password(password):
            login_user(user)
            flash('Logged in successfully!', 'success')
            if user.role == 'farmer':
                return redirect(url_for('main.farmer_dashboard'))
            else:
                return redirect(url_for('main.marketplace'))
        else:
            flash('Invalid Username or Password', 'error')
            
    return render_template('login.html')

@main.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Logged out.', 'info')
    return redirect(url_for('main.index'))

# --- Farmer Routes ---

@main.route('/farmer/dashboard')
@login_required
def farmer_dashboard():
    if current_user.role != 'farmer':
        flash('Access Denied', 'error')
        return redirect(url_for('main.index'))
    
    my_products = Product.query.filter_by(farmer_id=current_user.id).all()
    return render_template('farmer_dashboard.html', products=my_products)

@main.route('/farmer/add_product', methods=['GET', 'POST'])
@login_required
def add_product():
    if current_user.role != 'farmer':
        return redirect(url_for('main.index'))

    if request.method == 'POST':
        name = request.form.get('name')
        desc = request.form.get('description')
        price = float(request.form.get('price'))
        category = request.form.get('category')
        stock = int(request.form.get('stock'))
        image_url = request.form.get('image_url') # Optional: Image link

        new_product = Product(
            name=name, description=desc, price=price, 
            category=category, stock=stock, image_url=image_url,
            farmer_id=current_user.id
        )
        db.session.add(new_product)
        db.session.commit()
        flash('Product Added Successfully!', 'success')
        return redirect(url_for('main.farmer_dashboard'))

    return render_template('add_product.html')

@main.route('/farmer/delete/<int:id>')
@login_required
def delete_product(id):
    product = Product.query.get_or_404(id)
    if product.farmer_id != current_user.id:
        flash('Unauthorized action', 'error')
        return redirect(url_for('main.farmer_dashboard'))
    
    db.session.delete(product)
    db.session.commit()
    flash('Product Deleted', 'info')
    return redirect(url_for('main.farmer_dashboard'))

# --- Customer Routes ---

@main.route('/marketplace')
def marketplace():
    category_filter = request.args.get('category')
    if category_filter:
        products = Product.query.filter_by(category=category_filter, stock__gt=0).all()
    else:
        products = Product.query.filter(Product.stock > 0).all()
    
    categories = ['Vegetables', 'Fruits', 'Grains', 'Dairy', 'Other']
    return render_template('marketplace.html', products=products, categories=categories, selected_cat=category_filter)

@main.route('/product/<int:id>')
def product_detail(id):
    product = Product.query.get_or_404(id)
    return render_template('product_detail.html', product=product)

@main.route('/add_to_cart/<int:id>', methods=['POST'])
@login_required
def add_to_cart(id):
    if current_user.role != 'customer':
        flash('Only customers can buy.', 'error')
        return redirect(url_for('main.marketplace'))

    qty = int(request.form.get('quantity', 1))
    product = Product.query.get_or_404(id)

    if qty > product.stock:
        flash('Not enough stock available!', 'error')
        return redirect(url_for('main.product_detail', id=id))

    # Simple Session Cart Logic
    cart = session.get('cart', {})
    cart[str(id)] = cart.get(str(id), 0) + qty
    session['cart'] = cart
    
    flash(f'Added {qty} {product.name} to cart', 'success')
    return redirect(url_for('main.cart'))

@main.route('/cart')
@login_required
def cart():
    if current_user.role != 'customer':
        return redirect(url_for('main.marketplace'))
    
    cart_dict = session.get('cart', {})
    cart_items = []
    total = 0

    for prod_id, qty in cart_dict.items():
        product = Product.query.get(int(prod_id))
        if product:
            item_total = product.price * qty
            total += item_total
            cart_items.append({'product': product, 'qty': qty, 'total': item_total})

    return render_template('cart.html', items=cart_items, total=total)

@main.route('/remove_from_cart/<int:id>')
@login_required
def remove_from_cart(id):
    cart = session.get('cart', {})
    if str(id) in cart:
        del cart[str(id)]
        session['cart'] = cart
    return redirect(url_for('main.cart'))

@main.route('/checkout', methods=['POST'])
@login_required
def checkout():
    if current_user.role != 'customer':
        return redirect(url_for('main.marketplace'))

    cart_dict = session.get('cart', {})
    if not cart_dict:
        flash('Cart is empty', 'error')
        return redirect(url_for('main.cart'))

    total_amount = 0
    order_items_list = []

    # Validate Stock again before ordering
    for prod_id, qty in cart_dict.items():
        product = Product.query.get(int(prod_id))
        if not product or product.stock < qty:
            flash(f'Stock updated for {product.name}. Please check cart.', 'error')
            return redirect(url_for('main.cart'))
        total_amount += product.price * qty
        order_items_list.append({'prod': product, 'qty': qty})

    # Create Order
    new_order = Order(customer_id=current_user.id, total_amount=total_amount)
    db.session.add(new_order)
    db.session.flush() # Get ID

    # Save Items & Reduce Stock
    for item in order_items_list:
        order_item = OrderItem(
            order_id=new_order.id,
            product_id=item['prod'].id,
            quantity=item['qty'],
            price_at_purchase=item['prod'].price
        )
        db.session.add(order_item)
        item['prod'].stock -= item['qty']

    db.session.commit()
    session.pop('cart', None) # Clear cart
    flash('Order Placed Successfully! Farmer will contact you soon.', 'success')
    return redirect(url_for('main.orders'))

# ... (ye sabse upar wale imports pehle se honge) ...

@main.route('/orders')
@login_required
def orders():
    if current_user.role == 'customer':
        my_orders = Order.query.filter_by(customer_id=current_user.id).order_by(Order.date.desc()).all()
        return render_template('orders.html', orders=my_orders, role='customer')
    else:
        all_orders = Order.query.all() 
        return render_template('orders.html', orders=all_orders, role='farmer')

# --- YAHAN SE NAYA CODE SHURU HOTA HAI ---

@main.route('/forgot_password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        username = request.form.get('username')
        new_password = request.form.get('new_password')
        
        user = User.query.filter_by(username=username).first()
        
        if user:
            # Password update karein
            user.set_password(new_password)
            db.session.commit()
            flash('Password reset successful! Please login.', 'success')
            return redirect(url_for('main.login'))
        else:
            flash('Username not found!', 'error')
            
    return render_template('forgot_password.html')
    
