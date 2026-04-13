class TodoManager {
    constructor() {
        this.currentFilter = 'all';
        this.allTodos = [];
        this.init();
    }
    
    init() {
        this.loadTodos();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        const addForm = document.getElementById('addTodoForm');
        if (addForm) {
            addForm.addEventListener('submit', (e) => this.addTodo(e));
        }
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.currentTarget.dataset.filter);
            });
        });
        
        const saveBtn = document.getElementById('saveTodoBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.updateTodo());
        }
    }
    
    setFilter(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        this.renderTodos();
    }
    
    async loadTodos() {
        this.showLoading(true);
        try {
            const response = await fetch('/api/todos/');
            if (!response.ok) throw new Error('Failed to load todos');
            this.allTodos = await response.json();
            this.renderTodos();
        } catch (error) {
            console.error('Error:', error);
            this.showError('Failed to load todos');
        } finally {
            this.showLoading(false);
        }
    }
    
    renderTodos() {
        const filteredTodos = this.filterTodos();
        const container = document.getElementById('todosList');
        
        if (!container) return;
        
        if (filteredTodos.length === 0) {
            container.innerHTML = '<div class="text-center py-5"><p class="text-muted">No todos found</p></div>';
            return;
        }
        
        container.innerHTML = filteredTodos.map(todo => this.createTodoHTML(todo)).join('');
    }
    
    filterTodos() {
        if (this.currentFilter === 'pending') {
            return this.allTodos.filter(t => !t.completed);
        } else if (this.currentFilter === 'completed') {
            return this.allTodos.filter(t => t.completed);
        }
        return this.allTodos;
    }
    
    createTodoHTML(todo) {
        const completedClass = todo.completed ? 'completed' : '';
        const titleClass = todo.completed ? 'text-muted' : '';
        
        return `
            <div class="card mb-3 todo-card ${completedClass}" data-todo-id="${todo.id}">
                <div class="card-body">
                    <div class="d-flex align-items-start justify-content-between">
                        <div class="d-flex align-items-start flex-grow-1">
                            <input type="checkbox" class="todo-checkbox me-3 mt-1" 
                                   ${todo.completed ? 'checked' : ''} 
                                   onchange="window.todoManager.toggleComplete(${todo.id})">
                            <div class="flex-grow-1">
                                <h6 class="todo-title mb-1 ${titleClass}">${this.escapeHtml(todo.title)}</h6>
                                ${todo.description ? `<div class="description-preview">${this.escapeHtml(todo.description)}</div>` : ''}
                                ${todo.due_date ? `<div class="due-date mt-2">Due: ${this.formatDate(todo.due_date)}</div>` : ''}
                            </div>
                        </div>
                        <div>
                            <button class="btn btn-sm btn-outline-primary btn-todo-action me-1" 
                                    onclick="window.todoManager.editTodo(${todo.id})">
                                Edit
                            </button>
                            <button class="btn btn-sm btn-outline-danger btn-todo-action" 
                                    onclick="window.todoManager.deleteTodo(${todo.id})">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    async addTodo(event) {
        event.preventDefault();
        
        const title = document.getElementById('todoTitle').value.trim();
        if (!title) {
            this.showError('Please enter a title');
            return;
        }
        
        const todoData = {
            title: title,
            description: document.getElementById('todoDescription').value.trim() || null,
            due_date: document.getElementById('todoDueDate').value || null,
            completed: false
        };
        
        try {
            const response = await fetch('/api/todos/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(todoData)
            });
            
            if (!response.ok) throw new Error('Failed to add todo');
            
            document.getElementById('addTodoForm').reset();
            await this.loadTodos();
            this.showSuccess('Todo added successfully!');
        } catch (error) {
            console.error('Error:', error);
            this.showError('Failed to add todo');
        }
    }
    
    async toggleComplete(todoId) {
        try {
            const response = await fetch(`/api/todos/${todoId}/toggle`, {
                method: 'PATCH',
                headers: { 'Accept': 'application/json' }
            });
            
            if (!response.ok) throw new Error('Failed to toggle');
            await this.loadTodos();
        } catch (error) {
            console.error('Error:', error);
            this.showError('Failed to update todo');
        }
    }
    
    async editTodo(todoId) {
        try {
            const response = await fetch(`/api/todos/${todoId}`);
            if (!response.ok) throw new Error('Failed to load todo');
            
            const todo = await response.json();
            const modal = document.getElementById('editTodoModal');
            const modalInstance = bootstrap.Modal.getInstance(modal);
            
            document.getElementById('editTodoId').value = todo.id;
            document.getElementById('editTitle').value = todo.title;
            document.getElementById('editDescription').value = todo.description || '';
            document.getElementById('editDueDate').value = todo.due_date ? todo.due_date.slice(0, 16) : '';
            document.getElementById('editCompleted').checked = todo.completed;
            
            modalInstance.show();
        } catch (error) {
            console.error('Error:', error);
            this.showError('Failed to load todo details');
        }
    }
    
    async updateTodo() {
        const todoId = document.getElementById('editTodoId').value;
        const updateData = {
            title: document.getElementById('editTitle').value.trim(),
            description: document.getElementById('editDescription').value.trim() || null,
            due_date: document.getElementById('editDueDate').value || null,
            completed: document.getElementById('editCompleted').checked
        };
        
        if (!updateData.title) {
            this.showError('Title is required');
            return;
        }
        
        try {
            const response = await fetch(`/api/todos/${todoId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(updateData)
            });
            
            if (!response.ok) throw new Error('Failed to update');
            
            const modal = document.getElementById('editTodoModal');
            const modalInstance = bootstrap.Modal.getInstance(modal);
            modalInstance.hide();
            
            await this.loadTodos();
            this.showSuccess('Todo updated successfully!');
        } catch (error) {
            console.error('Error:', error);
            this.showError('Failed to update todo');
        }
    }
    
    async deleteTodo(todoId) {
        if (!confirm('Are you sure you want to delete this todo?')) return;
        
        try {
            const response = await fetch(`/api/todos/${todoId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Failed to delete');
            await this.loadTodos();
            this.showSuccess('Todo deleted successfully!');
        } catch (error) {
            console.error('Error:', error);
            this.showError('Failed to delete todo');
        }
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showLoading(show) {
        const indicator = document.getElementById('loadingIndicator');
        if (indicator) {
            if (show) {
                indicator.classList.remove('d-none');
            } else {
                indicator.classList.add('d-none');
            }
        }
    }
    
    showError(message) {
        alert(message);
    }
    
    showSuccess(message) {
        alert(message);
    }
}

let todoManager;
document.addEventListener('DOMContentLoaded', () => {
    todoManager = new TodoManager();
    window.todoManager = todoManager; // Make accessible globally
});