from fastapi import APIRouter, Request

router = APIRouter()

@router.get("/me")
async def get_current_user_data(request: Request):
    # El usuario ya fue validado por el middleware
    user = request.state.user
    return {"id": user.id, "email": user.email, "role": user.type}
