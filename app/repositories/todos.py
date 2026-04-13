from sqlmodel import Session, select
from typing import List, Optional
from app.models.todos import Todo, TodoCreate, TodoUpdate
from datetime import datetime, timezone

class TodoRepository:
    def __init__(self, session: Session):
        self.session = session
    
    def create_todo(self, user_id: int, todo_data: TodoCreate) -> Todo:
        todo = Todo(
            user_id=user_id,
            title=todo_data.title,
            description=todo_data.description,
            completed=todo_data.completed,
            due_date=todo_data.due_date
        )
        self.session.add(todo)
        self.session.commit()
        self.session.refresh(todo)
        return todo
    
    def get_user_todos(self, user_id: int) -> List[Todo]:
        statement = select(Todo).where(Todo.user_id == user_id).order_by(Todo.created_at.desc())
        return self.session.exec(statement).all()
    
    def get_todo_by_id(self, todo_id: int, user_id: int) -> Optional[Todo]:
        statement = select(Todo).where(Todo.id == todo_id, Todo.user_id == user_id)
        return self.session.exec(statement).first()
    
    def update_todo(self, todo_id: int, user_id: int, todo_data: TodoUpdate) -> Optional[Todo]:
        todo = self.get_todo_by_id(todo_id, user_id)
        if todo:
            update_data = todo_data.model_dump(exclude_unset=True)
            for key, value in update_data.items():
                setattr(todo, key, value)
            todo.updated_at = datetime.now(timezone.utc)
            self.session.add(todo)
            self.session.commit()
            self.session.refresh(todo)
        return todo
    
    def delete_todo(self, todo_id: int, user_id: int) -> bool:
        todo = self.get_todo_by_id(todo_id, user_id)
        if todo:
            self.session.delete(todo)
            self.session.commit()
            return True
        return False
    
    def toggle_complete(self, todo_id: int, user_id: int) -> Optional[Todo]:
        todo = self.get_todo_by_id(todo_id, user_id)
        if todo:
            todo.completed = not todo.completed
            todo.updated_at = datetime.now(timezone.utc)
            self.session.add(todo)
            self.session.commit()
            self.session.refresh(todo)
        return todo