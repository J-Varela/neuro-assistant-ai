"""Integration tests for API routes — AI service is mocked, DB is SQLite."""
from unittest.mock import patch

import pytest


_BREAKDOWN_RESULT = {
    "goal": "Finish the report",
    "steps": ["Outline sections", "Write draft", "Review"],
    "next_step": "Outline sections",
    "estimated_effort": "2 hours",
}

_SIMPLIFY_RESULT = {
    "simplified_text": "This is easier to read.",
    "key_points": ["Point A", "Point B"],
    "action_items": ["Do X", "Do Y"],
}

_FOCUS_RESULT = {
    "supportive_prompt": "You can do this one step at a time.",
    "suggested_duration_minutes": 25,
}


# --- Breakdown ---

async def test_breakdown_task_success(client):
    with patch("app.routes.breakdown.generate_breakdown", return_value=_BREAKDOWN_RESULT):
        response = await client.post(
            "/api/breakdown-task",
            json={"text": "Write a report by Friday", "support_mode": "general"},
            headers={"X-Session-ID": "test-session-breakdown"},
        )
    assert response.status_code == 200
    data = response.json()
    assert data["goal"] == "Finish the report"
    assert len(data["steps"]) == 3
    assert data["next_step"] == "Outline sections"


async def test_breakdown_task_invalid_input(client):
    response = await client.post(
        "/api/breakdown-task",
        json={"text": "", "support_mode": "general"},
        headers={"X-Session-ID": "test-session-invalid-input"},
    )
    assert response.status_code == 422


async def test_breakdown_task_invalid_support_mode(client):
    response = await client.post(
        "/api/breakdown-task",
        json={"text": "Do something", "support_mode": "invalid_mode"},
        headers={"X-Session-ID": "test-session-invalid-mode"},
    )
    assert response.status_code == 422


# --- Simplify ---

async def test_simplify_text_success(client):
    with patch("app.routes.simplify.generate_simplified_text", return_value=_SIMPLIFY_RESULT):
        response = await client.post(
            "/api/simplify-text",
            json={"text": "Dense and complex paragraph here.", "support_mode": "dyslexia"},
            headers={"X-Session-ID": "test-session-simplify"},
        )
    assert response.status_code == 200
    data = response.json()
    assert data["simplified_text"] == "This is easier to read."
    assert "Point A" in data["key_points"]


# --- Focus ---

async def test_focus_session_success(client):
    with patch("app.routes.focus.generate_focus_session_ai", return_value=_FOCUS_RESULT):
        response = await client.post(
            "/api/generate-focus-session",
            json={"step_text": "Outline sections", "support_mode": "adhd", "duration_minutes": 25},
            headers={"X-Session-ID": "test-session-focus"},
        )
    assert response.status_code == 200
    data = response.json()
    assert data["duration_minutes"] == 25
    assert "one step at a time" in data["supportive_prompt"]


async def test_focus_session_clamps_bad_duration(client):
    bad_focus_result = {**_FOCUS_RESULT, "suggested_duration_minutes": 9999}
    with patch("app.routes.focus.generate_focus_session_ai", return_value=bad_focus_result):
        response = await client.post(
            "/api/generate-focus-session",
            json={"step_text": "Do the thing", "support_mode": "general", "duration_minutes": 25},
            headers={"X-Session-ID": "test-session-focus-clamp"},
        )
    assert response.status_code == 200
    assert response.json()["duration_minutes"] == 120  # clamped to max


async def test_focus_session_does_not_create_history_entry(client):
    with patch("app.routes.focus.generate_focus_session_ai", return_value=_FOCUS_RESULT):
        response = await client.post(
            "/api/generate-focus-session",
            json={"step_text": "Outline sections", "support_mode": "adhd", "duration_minutes": 25},
            headers={"X-Session-ID": "test-session-focus-history"},
        )
    assert response.status_code == 200

    history = await client.get("/api/history", headers={"X-Session-ID": "test-session-focus-history"})
    assert history.status_code == 200
    assert history.json() == []


# --- History ---

async def test_history_session_isolation(client):
    """Two different session IDs must NOT see each other's history."""
    with patch("app.routes.breakdown.generate_breakdown", return_value=_BREAKDOWN_RESULT):
        await client.post(
            "/api/breakdown-task",
            json={"text": "Task for session A", "support_mode": "general"},
            headers={"X-Session-ID": "isolation-session-a"},
        )

    history_a = await client.get("/api/history", headers={"X-Session-ID": "isolation-session-a"})
    history_b = await client.get("/api/history", headers={"X-Session-ID": "isolation-session-b"})

    assert history_a.status_code == 200
    assert len(history_a.json()) >= 1

    assert history_b.status_code == 200
    assert len(history_b.json()) == 0


async def test_delete_history_entry(client):
    with patch("app.routes.breakdown.generate_breakdown", return_value=_BREAKDOWN_RESULT):
        await client.post(
            "/api/breakdown-task",
            json={"text": "Task to delete", "support_mode": "general"},
            headers={"X-Session-ID": "delete-session"},
        )

    history = await client.get("/api/history", headers={"X-Session-ID": "delete-session"})
    assert history.status_code == 200
    entries = history.json()
    assert len(entries) >= 1

    entry_id = entries[0]["id"]
    delete_resp = await client.delete(
        f"/api/history/{entry_id}",
        headers={"X-Session-ID": "delete-session"},
    )
    assert delete_resp.status_code == 204

    # Entry should be gone
    history_after = await client.get("/api/history", headers={"X-Session-ID": "delete-session"})
    ids_after = [e["id"] for e in history_after.json()]
    assert entry_id not in ids_after


async def test_delete_history_wrong_session(client):
    """A session must not be able to delete another session's entry."""
    with patch("app.routes.breakdown.generate_breakdown", return_value=_BREAKDOWN_RESULT):
        await client.post(
            "/api/breakdown-task",
            json={"text": "Protected task", "support_mode": "general"},
            headers={"X-Session-ID": "owner-session"},
        )

    history = await client.get("/api/history", headers={"X-Session-ID": "owner-session"})
    entry_id = history.json()[0]["id"]

    delete_resp = await client.delete(
        f"/api/history/{entry_id}",
        headers={"X-Session-ID": "attacker-session"},
    )
    assert delete_resp.status_code == 404


# --- Auth ---

async def test_register_and_login(client):
    reg = await client.post(
        "/api/auth/register",
        json={"email": "newuser@example.com", "password": "securepassword1"},
    )
    assert reg.status_code == 201
    assert reg.json()["email"] == "newuser@example.com"

    login = await client.post(
        "/api/auth/token",
        data={"username": "newuser@example.com", "password": "securepassword1"},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]
    assert token


async def test_register_duplicate_email(client):
    await client.post(
        "/api/auth/register",
        json={"email": "duplicate@example.com", "password": "password123"},
    )
    resp = await client.post(
        "/api/auth/register",
        json={"email": "duplicate@example.com", "password": "password123"},
    )
    assert resp.status_code == 400


async def test_login_wrong_password(client):
    await client.post(
        "/api/auth/register",
        json={"email": "wrongpass@example.com", "password": "correctpass1"},
    )
    resp = await client.post(
        "/api/auth/token",
        data={"username": "wrongpass@example.com", "password": "wrongpass"},
    )
    assert resp.status_code == 401


async def test_get_me_requires_auth(client):
    resp = await client.get("/api/auth/me")
    assert resp.status_code == 401  # no Bearer token provided


async def test_get_me_with_valid_token(client):
    await client.post(
        "/api/auth/register",
        json={"email": "me@example.com", "password": "mypassword1"},
    )
    login = await client.post(
        "/api/auth/token",
        data={"username": "me@example.com", "password": "mypassword1"},
    )
    token = login.json()["access_token"]

    me = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == "me@example.com"


async def test_forgot_password_hides_reset_token_by_default(client):
    await client.post(
        "/api/auth/register",
        json={"email": "resetme@example.com", "password": "oldpassword1"},
    )

    response = await client.post(
        "/api/auth/forgot-password",
        json={"email": "resetme@example.com"},
    )

    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert data["reset_token"] is None


async def test_forgot_password_returns_reset_token_when_dev_flag_enabled(client):
    from app.core import config

    original = config.PASSWORD_RESET_RETURN_TOKEN
    config.PASSWORD_RESET_RETURN_TOKEN = True
    try:
        await client.post(
            "/api/auth/register",
            json={"email": "resetdev@example.com", "password": "oldpassword1"},
        )

        response = await client.post(
            "/api/auth/forgot-password",
            json={"email": "resetdev@example.com"},
        )
    finally:
        config.PASSWORD_RESET_RETURN_TOKEN = original

    assert response.status_code == 200
    assert response.json()["reset_token"]


async def test_reset_password_updates_credentials(client):
    await client.post(
        "/api/auth/register",
        json={"email": "changeit@example.com", "password": "oldpassword1"},
    )

    from app.core import config

    original = config.PASSWORD_RESET_RETURN_TOKEN
    config.PASSWORD_RESET_RETURN_TOKEN = True
    try:
        forgot = await client.post(
            "/api/auth/forgot-password",
            json={"email": "changeit@example.com"},
        )
        token = forgot.json()["reset_token"]
    finally:
        config.PASSWORD_RESET_RETURN_TOKEN = original

    reset = await client.post(
        "/api/auth/reset-password",
        json={"token": token, "new_password": "newpassword1"},
    )
    assert reset.status_code == 204

    old_login = await client.post(
        "/api/auth/token",
        data={"username": "changeit@example.com", "password": "oldpassword1"},
    )
    assert old_login.status_code == 401

    new_login = await client.post(
        "/api/auth/token",
        data={"username": "changeit@example.com", "password": "newpassword1"},
    )
    assert new_login.status_code == 200


async def test_reset_password_rejects_invalid_token(client):
    response = await client.post(
        "/api/auth/reset-password",
        json={"token": "invalid-reset-token-value-12345", "new_password": "newpassword1"},
    )
    assert response.status_code == 400


async def test_jwt_session_uses_user_id(client):
    """When authenticated, history is tied to user ID, not the X-Session-ID header."""
    await client.post(
        "/api/auth/register",
        json={"email": "jwtuser@example.com", "password": "jwtpassword1"},
    )
    login = await client.post(
        "/api/auth/token",
        data={"username": "jwtuser@example.com", "password": "jwtpassword1"},
    )
    token = login.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    with patch("app.routes.breakdown.generate_breakdown", return_value=_BREAKDOWN_RESULT):
        await client.post(
            "/api/breakdown-task",
            json={"text": "JWT-scoped task", "support_mode": "general"},
            headers=auth_headers,
        )

    # History retrieved with JWT should return the entry
    history = await client.get("/api/history", headers=auth_headers)
    assert history.status_code == 200
    assert len(history.json()) >= 1

    # Same history is NOT visible via an anonymous session ID
    anon_history = await client.get(
        "/api/history", headers={"X-Session-ID": "some-other-session"}
    )
    jwt_ids = {e["id"] for e in history.json()}
    anon_ids = {e["id"] for e in anon_history.json()}
    assert jwt_ids.isdisjoint(anon_ids)


async def test_history_rejects_invalid_bearer_token(client):
    resp = await client.get(
        "/api/history",
        headers={
            "Authorization": "Bearer definitely-not-a-valid-jwt",
            "X-Session-ID": "fallback-session",
        },
    )
    assert resp.status_code == 401


async def test_history_requires_explicit_session_id_when_anonymous(client):
    resp = await client.get("/api/history")
    assert resp.status_code == 400
