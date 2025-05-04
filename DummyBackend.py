from flask import Flask, jsonify, request
from flask_cors import CORS


app = Flask(__name__)
CORS(app)

# Mocked database of users
USERS_DB = [
    {"id": 1, "email": "admin@example.com", "username": "admin", "role": "ADMIN", "enabled": True, "password": "adminpass"},
    {"id": 2, "email": "1@1.1", "username": "user1", "role": "STUDENT", "enabled": True, "password": "pass"}
]

# Mock Response Format (ReqResp-like)
def create_response(status_code, message, data=None, error=None):
    return {
        "statusCode": status_code,
        "message": message,
        "user": data if data else None,
        "userList": data if isinstance(data, list) else None,
        "token": data.get("token") if data else None,
        "refreshToken": data.get("refreshToken") if data else None,
        "expirationTime": data.get("expirationTime") if data else None,
        "error": error
    }

@app.route('/')
def home():
    return "Welcome to the User Management API!"

# Mock endpoint: /auth/register
@app.route('/auth/register', methods=['POST'])
def register():
    req_data = request.get_json()
    # Simulating the registration logic
    existing_user = next((user for user in USERS_DB if user['email'] == req_data['email']), None)
    if existing_user:
        return jsonify(create_response(400, "Email already exists"))
    
    new_user = {
        "id": len(USERS_DB) + 1,
        "email": req_data['email'],
        "username": req_data['username'],
        "role": req_data['role'],
        "enabled": True,
        "password": req_data['password']
    }
    USERS_DB.append(new_user)
    return jsonify(create_response(200, "User registered successfully", new_user))

# Mock endpoint: /auth/login
@app.route('/auth/login', methods=['POST'])
def login():
    req_data = request.get_json()
    user = next((user for user in USERS_DB if user['email'] == req_data['email']), None)
    if not user or user['password'] != req_data['password']:
        return jsonify(create_response(400, "Invalid credentials"))
    
    # Simulate JWT generation
    jwt_token = "mocked_jwt_token"
    refresh_token = "mocked_refresh_token"
    return jsonify(create_response(200, "Login successful", {
        "token": jwt_token,
        "refreshToken": refresh_token,
        "expirationTime": "24Hrs",
        "role": user['role']  # Return the role from USERS_DB
    }))

# Mock endpoint: /auth/refresh
@app.route('/auth/refresh', methods=['POST'])
def refresh():
    req_data = request.get_json()
    if not req_data.get('token'):
        return jsonify(create_response(400, "No token provided"))
    # Simulate token refresh logic
    return jsonify(create_response(200, "Successfully refreshed token", {
        "token": "new_mocked_jwt_token",
        "refreshToken": req_data['token'],
        "expirationTime": "24Hrs"
    }))

# Mock endpoint: /admin/get-all-users
@app.route('/admin/get-all-users', methods=['GET'])
def get_all_users():
    return jsonify(create_response(200, "Successful", USERS_DB))

# Mock endpoint: /admin/get-user/{userId}
@app.route('/admin/get-user/<int:userId>', methods=['GET'])
def get_user_by_id(userId):
    user = next((u for u in USERS_DB if u['id'] == userId), None)
    if user:
        return jsonify(create_response(200, f"User with ID {userId} found", user))
    return jsonify(create_response(404, f"User with ID {userId} not found"))

# Mock endpoint: /admin/get-user-by-role/{role}
@app.route('/admin/get-user-by-role/<role>', methods=['GET'])
def get_users_by_role(role):
    users = [u for u in USERS_DB if u['role'] == role]
    if users:
        return jsonify(create_response(200, f"Users with role {role} found", users))
    return jsonify(create_response(404, f"No users found with role {role}"))

# Mock endpoint: /admin/enable-disable/{userId}
@app.route('/admin/enable-disable/<int:userId>', methods=['PUT'])
def enable_disable_user(userId):
    user = next((u for u in USERS_DB if u['id'] == userId), None)
    if user:
        user['enabled'] = not user['enabled']
        return jsonify(create_response(200, f"User with ID {userId} status changed", user))
    return jsonify(create_response(404, f"User with ID {userId} not found"))

# Mock endpoint: /alluser/get-profile
@app.route('/alluser/get-profile', methods=['GET'])
def get_profile():
    # Simulate logged-in user
    logged_in_user = USERS_DB[0]  # Assume first user is logged in
    return jsonify(create_response(200, "Successful", logged_in_user))

# Mock endpoint: /alluser/change-password
@app.route('/alluser/change-password', methods=['PUT'])
def change_password():
    req_data = request.get_json()
    # Find and update password for logged-in user (simulated)
    logged_in_user = USERS_DB[0]
    logged_in_user['password'] = req_data['password']
    return jsonify(create_response(200, "Password changed successfully"))

if __name__ == '__main__':
    app.run(debug=True, port=8080)
