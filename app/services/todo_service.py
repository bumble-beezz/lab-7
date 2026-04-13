from typing import List, Optional
from app.repositories.todos import TodoRepository
from app.models.todos import TodoCreate, TodoUpdate, TodoResponse

class TodoService:
    def __init__(self, todo_repository: TodoRepository):
        self.todo_repository = todo_repository
    
    def create_todo(self, user_id: int, todo_data: TodoCreate) -> TodoResponse:
        todo = self.todo_repository.create_todo(user_id, todo_data)
        return TodoResponse.model_validate(todo)
    
    def get_user_todos(self, user_id: int) -> List[TodoResponse]:
        todos = self.todo_repository.get_user_todos(user_id)
        return [TodoResponse.model_validate(todo) for todo in todos]
    
    def get_todo_by_id(self, todo_id: int, user_id: int) -> Optional[TodoResponse]:
        todo = self.todo_repository.get_todo_by_id(todo_id, user_id)
        return TodoResponse.model_validate(todo) if todo else None
    
    def update_todo(self, todo_id: int, user_id: int, todo_data: TodoUpdate) -> Optional[TodoResponse]:
        todo = self.todo_repository.update_todo(todo_id, user_id, todo_data)
        return TodoResponse.model_validate(todo) if todo else None
    
    def delete_todo(self, todo_id: int, user_id: int) -> bool:
        return self.todo_repository.delete_todo(todo_id, user_id)
    
    def toggle_complete(self, todo_id: int, user_id: int) -> Optional[TodoResponse]:
        todo = self.todo_repository.toggle_complete(todo_id, user_id)
        return TodoResponse.model_validate(todo) if todo else None