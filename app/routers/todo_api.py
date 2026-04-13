from fastapi import APIRouter, HTTPException, status
from typing import List
from app.dependencies.session import SessionDep
from app.dependencies.auth import AuthDep
from app.services.todo_service import TodoService
from app.repositories.todos import TodoRepository
from app.models.todos import TodoCreate, TodoUpdate, TodoResponse

router = APIRouter(prefix="/todos", tags=["todos"])

@router.get("/", response_model=List[TodoResponse])
async def get_user_todos(
    user: AuthDep,
    db: SessionDep
):
    todo_repo = TodoRepository(db)
    todo_service = TodoService(todo_repo)
    return todo_service.get_user_todos(user.id)

@router.post("/", response_model=TodoResponse, status_code=status.HTTP_201_CREATED)
async def create_todo(
    todo_data: TodoCreate,
    user: AuthDep,
    db: SessionDep
):
    todo_repo = TodoRepository(db)
    todo_service = TodoService(todo_repo)
    return todo_service.create_todo(user.id, todo_data)

@router.get("/{todo_id}", response_model=TodoResponse)
async def get_todo(
    todo_id: int,
    user: AuthDep,
    db: SessionDep
):
    todo_repo = TodoRepository(db)
    todo_service = TodoService(todo_repo)
    todo = todo_service.get_todo_by_id(todo_id, user.id)
    if not todo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Todo not found")
    return todo

@router.put("/{todo_id}", response_model=TodoResponse)
async def update_todo(
    todo_id: int,
    todo_data: TodoUpdate,
    user: AuthDep,
    db: SessionDep
):
    todo_repo = TodoRepository(db)
    todo_service = TodoService(todo_repo)
    todo = todo_service.update_todo(todo_id, user.id, todo_data)
    if not todo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Todo not found")
    return todo

@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_todo(
    todo_id: int,
    user: AuthDep,
    db: SessionDep
):
    todo_repo = TodoRepository(db)
    todo_service = TodoService(todo_repo)
    deleted = todo_service.delete_todo(todo_id, user.id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Todo not found")
    return None

@router.patch("/{todo_id}/toggle", response_model=TodoResponse)
async def toggle_todo_complete(
    todo_id: int,
    user: AuthDep,
    db: SessionDep
):
    todo_repo = TodoRepository(db)
    todo_service = TodoService(todo_repo)
    todo = todo_service.toggle_complete(todo_id, user.id)
    if not todo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Todo not found")
    return todo