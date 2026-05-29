import { AIMessage } from './aiProviders';

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function generateMockResponse(messages: AIMessage[], mode: string): string {
  const lastMessage = messages[messages.length - 1]?.content || '';
  const hash = hashString(lastMessage + mode);
  const responses = MOCK_RESPONSES[mode] || MOCK_RESPONSES.explain;
  return responses[hash % responses.length];
}

const MOCK_RESPONSES: Record<string, string[]> = {
  explain: [
    `## Line-by-Line Breakdown

\`\`\`python
# Line 1: Import the requests library for HTTP calls
import requests

# Line 2: Define the API endpoint URL
url = "https://api.example.com/data"

# Line 3-4: Set headers with authentication token
headers = {
    "Authorization": "Bearer YOUR_TOKEN",
    "Content-Type": "application/json"
}

# Line 5: Make a GET request to the endpoint
response = requests.get(url, headers=headers)

# Line 6: Check if the request was successful
if response.status_code == 200:
    # Line 7: Parse JSON response into Python dict
    data = response.json()
    # Line 8: Print the formatted data
    print(f"Retrieved {len(data)} records")
\`\`\`

### Logic Flow
1. **Import Phase**: Loads the \\"requests\\" library which handles HTTP
2. **Configuration Phase**: Sets up the URL and authentication headers
3. **Execution Phase**: Sends the GET request and waits for response
4. **Validation Phase**: Checks HTTP 200 status before processing
5. **Processing Phase**: Converts JSON to Python objects and outputs results

### Beginner Mode Notes
- Think of \\"requests.get()\\" like typing a URL in your browser
- The headers tell the server WHO you are (like showing ID)
- \\"response.json()\\" turns the server's text into usable Python data

### Advanced Mode Notes
- Consider using \\"requests.Session()\\" for connection pooling
- Add timeout parameters to prevent hanging requests
- Implement retry logic with exponential backoff for production use`,

    `## Code Explanation

\`\`\`javascript
// This is an async function that fetches user data
async function getUserData(userId) {
  // Construct the API URL with the user ID
  const url = \\"https://api.example.com/users/\\" + userId;
  
  // Try to fetch the data
  try {
    const response = await fetch(url);
    // If response is not OK, throw an error
    if (!response.ok) {
      throw new Error(\\"Failed to fetch user\\");
    }
    // Parse JSON response
    const user = await response.json();
    return user;
  } catch (error) {
    // Log and re-throw the error
    console.error(\\"Error:\\", error);
    throw error;
  }
}
\`\`\`

### How It Works
1. **Function Declaration**: Declares an async function that accepts a userId parameter
2. **URL Construction**: Builds the endpoint URL dynamically
3. **Fetch Call**: Makes an asynchronous HTTP GET request
4. **Error Handling**: Validates response status and catches network errors
5. **Data Return**: Returns parsed user object to the caller

### Key Concepts
- **Async/Await**: Pauses execution until the Promise resolves
- **Try/Catch**: Gracefully handles failures without crashing
- **Fetch API**: Modern browser API for HTTP requests`,
  ],

  bugfinder: [
    `## Bug Analysis Report

### 🔴 Critical Issues Found

**1. Undefined Variable (Line 12)**
\`\`\`python
# BUG: 'result' is used before assignment
print(result)  # NameError: name 'result' is not defined
result = calculate()
\`\`\`
**Fix**: Move the print statement after the assignment.

**2. Infinite Loop (Line 8)**
\`\`\`python
# BUG: i is never incremented
while i < 10:
    print(i)
    # Missing: i += 1
\`\`\`
**Fix**: Add \\"i += 1\\" inside the loop body.

### 🟡 Code Smells

**3. Mutable Default Argument (Line 3)**
\`\`\`python
# DANGER: Lists as default args are shared across calls
def process(items=[]):
    items.append(1)
    return items
\`\`\`
**Fix**: Use \\"items=None\\" and initialize inside the function.

**4. Bare Except Clause (Line 25)**
\`\`\`python
# Catches KeyboardInterrupt and SystemExit too
try:
    risky_op()
except:  # Too broad
    pass
\`\`\`
**Fix**: Catch specific exceptions like \\"except ValueError:\\"

### ✅ Recommendations
- Add type hints for better IDE support
- Use logging instead of print statements
- Consider using list comprehensions for cleaner code`,

    `## Bug Detection Results

### ❌ Syntax Errors
**Line 7**: Missing closing parenthesis
\`\`\`javascript
console.log("Hello World"  // Missing )
\`\`\`

### ⚠️ Logic Bugs
**Line 15**: Off-by-one error in loop condition
\`\`\`javascript
for (let i = 0; i <= array.length; i++) {
    // Accesses array[array.length] which is undefined
    console.log(array[i]);
}
\`\`\`
**Fix**: Change \\"<=\\" to \\"<\\"

**Line 22**: Race condition in async code
\`\`\`javascript
// Multiple promises modify shared state
await Promise.all([
  updateUser(userId, { name: "A" }),
  updateUser(userId, { name: "B" })
]);
\`\`\`

### 📝 Missing Imports
- \\"import { useEffect } from 'react'\\" is missing
- \\"import axios from 'axios'\\" needed for API calls

### 🧹 Code Smells
- Function is 120 lines long (consider splitting)
- 5 levels of nesting (refactor into smaller functions)
- Magic number \\"42\\" used without explanation`,
  ],

  generator: [
    `## Generated Code

\`\`\`python
import json
from datetime import datetime
from typing import Dict, List, Optional

class TaskManager:
    \"\"\"A robust task management system with persistence.\"\"\"
    
    def __init__(self, storage_path: str = "tasks.json"):
        self.storage_path = storage_path
        self.tasks: List[Dict] = []
        self._load_tasks()
    
    def _load_tasks(self) -> None:
        \"\"\"Load tasks from persistent storage.\"\"\"
        try:
            with open(self.storage_path, 'r') as f:
                self.tasks = json.load(f)
        except FileNotFoundError:
            self.tasks = []
    
    def add_task(self, title: str, priority: str = "medium") -> Dict:
        \"\"\"Add a new task to the system.\"\"\"
        task = {
            "id": len(self.tasks) + 1,
            "title": title,
            "priority": priority,
            "completed": False,
            "created_at": datetime.now().isoformat()
        }
        self.tasks.append(task)
        self._save_tasks()
        return task
    
    def complete_task(self, task_id: int) -> Optional[Dict]:
        \"\"\"Mark a task as completed.\"\"\"
        for task in self.tasks:
            if task["id"] == task_id:
                task["completed"] = True
                task["completed_at"] = datetime.now().isoformat()
                self._save_tasks()
                return task
        return None
    
    def _save_tasks(self) -> None:
        \"\"\"Persist tasks to storage.\"\"\"
        with open(self.storage_path, 'w') as f:
            json.dump(self.tasks, f, indent=2)
\`\`\`

### Project Structure
\`\`
task-manager/
├── task_manager.py      # Core module
├── cli.py               # Command-line interface
├── tests/
│   ├── test_manager.py
│   └── test_cli.py
├── requirements.txt
└── README.md
\`\`

### Usage Example
\`\`\`python
manager = TaskManager()
task = manager.add_task("Review PR #42", priority="high")
manager.complete_task(task["id"])
\`\`\``,

    `## Generated React Component

\`\`\`tsx
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

export const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState('');

  const addTodo = useCallback(() => {
    if (!inputValue.trim()) return;
    
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text: inputValue.trim(),
      completed: false,
      createdAt: new Date(),
    };
    
    setTodos(prev => [newTodo, ...prev]);
    setInputValue('');
  }, [inputValue]);

  const toggleTodo = useCallback((id: string) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  }, []);

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Todo List</h1>
      
      <div className="flex gap-2 mb-4">
        <input
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTodo()}
          className="flex-1 px-4 py-2 border rounded"
          placeholder="Add a new task..."
        />
        <button onClick={addTodo} className="px-4 py-2 bg-blue-500 text-white rounded">
          Add
        </button>
      </div>
      
      <AnimatePresence>
        {todos.map(todo => (
          <motion.div
            key={todo.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="flex items-center gap-2 p-3 border rounded mb-2"
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span className={todo.completed ? 'line-through text-gray-400' : ''}>
              {todo.text}
            </span>
            <button onClick={() => deleteTodo(todo.id)} className="ml-auto text-red-500">
              Delete
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
\`\`\`

### Key Features
- ✅ TypeScript with proper interfaces
- ✅ React hooks (useState, useCallback)
- ✅ Framer Motion animations
- ✅ Accessibility considerations
- ✅ Optimized re-renders with useCallback`,
  ],

  debug: [
    `## Debug Analysis

### Error Breakdown
\`\`\`
TypeError: Cannot read property 'map' of undefined
    at UserList (UserList.js:15)
    at renderWithHooks (react-dom.development.js:16305)
\`\`\`

### Root Cause
The \\"users\\" prop is \\"undefined\\" when the component first renders. This happens because:
1. Parent component fetches data asynchronously
2. Child component renders before data arrives
3. \\"users.map()\\" is called on \\"undefined\\"

### Fix
\`\`\`javascript
// BEFORE (Broken)
function UserList({ users }) {
  return (
    <ul>
      {users.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}

// AFTER (Fixed)
function UserList({ users }) {
  // Add default value and loading state
  if (!users) return <div>Loading users...</div>;
  
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
\`\`\`

### Prevention
- Always provide default props: \\"UserList.defaultProps = { users: [] }\\"
- Use TypeScript to catch null/undefined at compile time
- Consider using optional chaining: \\"users?.map(...)\\"
- Implement proper loading and error states`,

    `## Stack Trace Analysis

### Error
\`\`\`
ReferenceError: processData is not defined
    at handleSubmit (form.js:42)
    at HTMLFormElement.<anonymous> (form.js:28)
\`\`\`

### Investigation Steps

**1. Check Scope**
\`\`\`javascript
// processData might be defined in a different scope
// or imported incorrectly
import { processData } from './utils';  // Check this import
\`\`\`

**2. Verify Module Exports**
\`\`\`javascript
// utils.js - Ensure this export exists
export function processData(data) {
  return data.filter(item => item.active);
}
// NOT: export default function processData(...) 
// (that would require different import syntax)
\`\`\`

**3. Check for Typos**
Common mistakes:
- \\"processData\\" vs \\"procesData\\" (missing 's')
- Case sensitivity: \\"ProcessData\\" vs \\"processData\\"

### Complete Fix
\`\`\`javascript
// form.js
import { processData } from './utils.js';  // Add .js extension for ES modules

function handleSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData);
  
  // Ensure processData exists before calling
  if (typeof processData !== 'function') {
    console.error('processData is not available');
    return;
  }
  
  const result = processData(data);
  console.log('Processed:', result);
}
\`\`\`

### Root Cause
ES Module import path was missing the \\".js\\" extension, causing the module to not load properly in browser environments.`,
  ],

  refactor: [
    `## Refactoring Recommendations

### Before
\`\`\`javascript
function calc(a, b, c) {
  let x = a + b;
  if (c == 'mul') {
    x = x * 2;
  } else if (c == 'div') {
    x = x / 2;
  }
  for (let i = 0; i < 10; i++) {
    x += i;
  }
  return x;
}
\`\`\`

### After
\`\`\`typescript
enum Operation {
  Multiply = 'mul',
  Divide = 'div',
  Add = 'add',
}

interface CalculationConfig {
  firstOperand: number;
  secondOperand: number;
  operation: Operation;
  iterations?: number;
}

/**
 * Performs a mathematical calculation with the specified operation.
 */
function calculate({
  firstOperand,
  secondOperand,
  operation,
  iterations = 10,
}: CalculationConfig): number {
  const baseSum = firstOperand + secondOperand;
  
  const operationHandlers: Record<Operation, (n: number) => number> = {
    [Operation.Multiply]: (n) => n * 2,
    [Operation.Divide]: (n) => n / 2,
    [Operation.Add]: (n) => n,
  };
  
  const afterOperation = operationHandlers[operation](baseSum);
  
  // Sum of 0 to iterations-1 = iterations * (iterations - 1) / 2
  const iterationSum = (iterations * (iterations - 1)) / 2;
  
  return afterOperation + iterationSum;
}
\`\`\`

### Improvements Made
1. **Type Safety**: Added TypeScript interfaces and enums
2. **Self-Documenting**: Descriptive parameter names replace single letters
3. **Open/Closed**: New operations can be added without modifying the function
4. **Performance**: Replaced O(n) loop with O(1) formula
5. **Immutability**: No reassignment of the result variable
6. **Pure Function**: Same inputs always produce same outputs`,

    `## Architecture Refactor

### Original Issues
- 500+ line file with mixed concerns
- Direct database calls in controller
- No separation between business logic and data access
- Magic strings throughout
- Tight coupling to external APIs

### Refactored Structure
\`\`
src/
├── domain/
│   ├── entities/
│   │   ├── User.ts
│   │   └── Order.ts
│   └── repositories/
│       ├── UserRepository.ts
│       └── OrderRepository.ts
├── application/
│   ├── services/
│   │   ├── UserService.ts
│   │   └── OrderService.ts
│   └── dto/
│       ├── CreateUserDto.ts
│       └── UpdateOrderDto.ts
├── infrastructure/
│   ├── database/
│   │   ├── connection.ts
│   │   └── migrations/
│   └── http/
│       ├── controllers/
│       └── middleware/
└── config/
    └── constants.ts
\`\`

### Key Changes
1. **Layered Architecture**: Clear separation of concerns
2. **Repository Pattern**: Abstract data access
3. **DTO Pattern**: Define data contracts explicitly
4. **Dependency Injection**: Services receive repositories via constructor
5. **Constants File**: All magic strings centralized`,
  ],

  roadmap: [
    `## Personalized Learning Roadmap

### 🎯 Goal: Full-Stack Developer

### Phase 1: Foundations (Weeks 1-4)
**Milestones:**
- ✅ Understand HTML semantic elements
- ✅ Master CSS Flexbox & Grid
- ✅ JavaScript ES6+ features
- ✅ Git workflow & GitHub

**Projects:**
1. Personal Portfolio Website
2. Interactive To-Do App
3. Weather Dashboard (API integration)

### Phase 2: Frontend Mastery (Weeks 5-10)
**Milestones:**
- ✅ React components & hooks
- ✅ State management (Redux/Zustand)
- ✅ TypeScript fundamentals
- ✅ Testing with Jest & React Testing Library

**Projects:**
1. E-commerce Product Page
2. Real-time Chat Application
3. Movie Database with Search

### Phase 3: Backend & APIs (Weeks 11-16)
**Milestones:**
- ✅ Node.js & Express
- ✅ Database design (PostgreSQL/MongoDB)
- ✅ RESTful API design
- ✅ Authentication & Authorization

**Projects:**
1. Blog Platform with CMS
2. Task Management API
3. Social Media Dashboard

### Phase 4: Advanced Topics (Weeks 17-24)
**Milestones:**
- ✅ System design fundamentals
- ✅ Docker & Kubernetes
- ✅ CI/CD pipelines
- ✅ Cloud deployment (AWS/Vercel)

**Recommended Resources:**
- MDN Web Docs (reference)
- "You Don't Know JS" book series
- Frontend Masters courses
- System Design Primer (GitHub)`,

    `## Python Data Science Roadmap

### 📊 Goal: Data Scientist

### Foundation (Month 1)
- Python basics: lists, dicts, functions
- NumPy: arrays, broadcasting, vectorization
- Pandas: DataFrames, Series, data manipulation

### Visualization (Month 2)
- Matplotlib: basic plots
- Seaborn: statistical visualization
- Plotly: interactive dashboards

### Machine Learning (Months 3-4)
- Scikit-learn: preprocessing, models, metrics
- Supervised learning: regression, classification
- Unsupervised learning: clustering, dimensionality

### Deep Learning (Months 5-6)
- PyTorch or TensorFlow
- Neural networks fundamentals
- CNNs for computer vision

### Milestone Projects
1. **Exploratory Data Analysis**: Analyze a Kaggle dataset
2. **Predictive Model**: House price prediction
3. **NLP Project**: Sentiment analysis on tweets
4. **Capstone**: End-to-end ML pipeline`,
  ],

  quiz: [
    `## Coding Challenge

### Question
What will be the output of this code?

\`\`\`javascript
const arr = [1, 2, 3];
arr[10] = 10;
console.log(arr.length);
console.log(arr[5]);
\`\`\`

### Options
A) \\"3\\" and \\"undefined\\"
B) \\"11\\" and \\"undefined\\"
C) \\"10\\" and \\"10\\"
D) \\"11\\" and \\"10\\"

### Correct Answer: **B**

### Explanation
When you assign \\"arr[10] = 10\\", JavaScript creates a sparse array with length 11. The elements at indices 3-9 are empty slots (not \\"undefined\\" values, but truly empty). Accessing \\"arr[5]\\" returns \\"undefined\\" because the slot is empty.

### Key Concept
JavaScript arrays are objects with numeric keys. Setting an index far beyond the current length extends the array but doesn't fill the intermediate indices.`,

    `## Debug Challenge

### The Bug
\`\`\`python
def find_duplicates(numbers):
    seen = set()
    duplicates = []
    for num in numbers:
        if num in seen:
            duplicates.append(num)
        seen.add(num)
    return duplicates

result = find_duplicates([1, 2, 2, 3, 3, 3, 4])
print(result)  # Expected: [2, 3, 3]
\`\`\`

### What's Wrong?
The function returns \\"[2, 3, 3]\\" which IS correct for this input. But try:
\`\`\`python
find_duplicates([1, 1, 1])  # Returns [1, 1] - is this desired?
\`\`\`

### The Real Issue
The function reports a duplicate EVERY time it sees a number already in \\"seen\\". If a number appears 3 times, it gets reported twice. Depending on requirements, you might want each duplicate only once.

### Fixed Version
\`\`\`python
def find_duplicates(numbers):
    seen = set()
    duplicates = set()
    for num in numbers:
        if num in seen:
            duplicates.add(num)
        seen.add(num)
    return list(duplicates)  # Each duplicate only once
\`\`\``,
  ],

  projects: [
    `## Project Ideas

### 🟢 Beginner Projects

**1. Personal Portfolio**
- Tech: HTML, CSS, JavaScript
- Skills: Responsive design, CSS Grid, animations
- Time: 1-2 weeks

**2. Weather App**
- Tech: JavaScript + OpenWeatherMap API
- Skills: API calls, async/await, DOM manipulation
- Time: 1 week

**3. Calculator**
- Tech: JavaScript
- Skills: Event handling, state management
- Time: 3-5 days

### 🟡 Intermediate Projects

**4. Task Manager with Categories**
- Tech: React, localStorage
- Skills: State management, CRUD operations, filtering
- Time: 2-3 weeks

**5. Real-time Chat**
- Tech: Node.js, Socket.io, Express
- Skills: WebSockets, event-driven architecture
- Time: 3-4 weeks

**6. URL Shortener**
- Tech: Full-stack (React + Node + MongoDB)
- Skills: Database design, REST APIs, hashing
- Time: 2-3 weeks

### 🔴 Advanced Projects

**7. Code Review Platform**
- Tech: React, Node.js, PostgreSQL, WebSockets
- Features: Syntax highlighting, inline comments, GitHub integration
- Time: 2-3 months

**8. Distributed Task Queue**
- Tech: Go/Rust, Redis, Docker
- Features: Worker pools, retry logic, monitoring dashboard
- Time: 1-2 months

**9. Programming Language Interpreter**
- Tech: C++/Rust
- Features: Lexer, Parser, AST, Evaluator
- Time: 2-3 months`,

    `## AI/ML Project Ideas

### Beginner
- **Spam Classifier**: Naive Bayes on SMS dataset
- **Iris Flower Classifier**: Classic ML introduction
- **Digit Recognizer**: MNIST with simple neural net

### Intermediate
- **Movie Recommender**: Collaborative filtering
- **Stock Price Predictor**: LSTM time series
- **Object Detector**: YOLO on custom dataset

### Advanced
- **Autonomous Agent**: Reinforcement learning game player
- **Code Completion Model**: Fine-tuned LLM for specific language
- **Multi-Modal RAG**: Combine text, image, and code retrieval`,
  ],
};
