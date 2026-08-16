#!/usr/bin/env python3
"""
Update Clerk magic-link email templates to Russian.

Usage:
  CLERK_SECRET_KEY=sk_... python3 scripts/update-clerk-templates-ru.py

Clerk Backend API endpoint:  PUT /v1/templates/email/{slug}
Docs: https://clerk.com/docs/reference/backend-api/tag/Email-Templates

Note: if the workspace returns HTTP 423 (email_template_customization_locked),
contact Clerk support or upgrade to Personal Pro to unlock template editing,
then run this script again.
"""

import os
import json
import subprocess

SECRET_KEY = os.environ.get("CLERK_SECRET_KEY", "")
BASE_URL = "https://api.clerk.com/v1/templates/email"

TEMPLATES = {
    "magic_link_sign_in": {
        "name": "Email link - Sign in",
        "subject": "Ваша ссылка для входа",
        "body": """\
<re-html>
<re-head>
    <re-title>
        Войдите в {{app.name}}
    </re-title>
</re-head>
<re-body background-color="#fff" padding="48px 32px 48px 32px">
    <re-preheader>
        Используйте ссылку ниже для входа в {{app.name}}
    </re-preheader>
    <re-header padding="16px 32px 8px 32px">
        <re-text font-size="18px" font-weight="bold" line-height="26px" color="#111827">
            {{> app_logo}}
        </re-text>
    </re-header>
    <re-main background-color="#fff" border-radius="0px">
        <re-block border-radius="0px" align="left" padding="32px 32px 48px 32px" background-color="#ffffff" font-size="14px" font-weight="bold" margin="64px 0px 0px 0px">
            <re-heading margin="0px 0px 0px 0px" level="h1" align="left" color="#111827" font-size="24px" line-height="32px">
                Войдите в {{app.name}}
            </re-heading>
            <re-text margin="16px 0px 0px 0px" align="left" font-size="14px" color="#747686" padding="15px 24px">
                Нажмите кнопку ниже, чтобы войти в {{app.name}}. Ссылка действительна {{ttl_minutes}} минут.
            </re-text>
            <re-button padding="6px 10px" href="{{magic_link}}" font-size="13px" border-radius="6px" margin="32px 0px 0px 0px" background-color="#131316" color="#ffffff">
                Войти
            </re-button>
            <re-text margin="16px 0px 64px 0px" font-size="14px" color="#747686">
                Если кнопка не работает, <a href="{{magic_link}}" style="color: #131316; text-decoration: underline;">нажмите здесь</a>.
            </re-text>
            <re-text margin="64px 0px 0px 0px" color="#747686" font-size="14px" padding="48px 32px">
                <b>Не запрашивали ссылку?</b>
            </re-text>
            <re-text font-size="14px" margin="4px 0px 0px 0px" color="#747686">
                Ссылка была запрошена с <b>{{requested_from}}</b> в <b>{{requested_at}}</b>. Если это были не вы — просто проигнорируйте это письмо.
            </re-text>
        </re-block>
    </re-main>
    <re-footer padding="24px 32px 48px">
        <re-divider background-color="#B7B8C2" height="1px"></re-divider>
        <re-text margin="16px 0px 0px 0px" font-size="13px" color="#747686">&copy; {{current_year}} {{app.name}}</re-text>
    </re-footer>
</re-body>
</re-html>
""",
    },
    "magic_link_sign_up": {
        "name": "Email link - Sign up",
        "subject": "Ваша ссылка для регистрации",
        "body": """\
<re-html>
<re-head>
    <re-title>
        Зарегистрируйтесь в {{app.name}}
    </re-title>
</re-head>
<re-body background-color="#fff" padding="48px 32px 48px 32px">
    <re-preheader>
        Используйте ссылку ниже для регистрации в {{app.name}}
    </re-preheader>
    <re-header padding="16px 32px 8px 32px">
        <re-text font-size="18px" font-weight="bold" line-height="26px" color="#111827">
            {{> app_logo}}
        </re-text>
    </re-header>
    <re-main background-color="#fff" border-radius="0px">
        <re-block border-radius="0px" align="left" padding="32px 32px 48px 32px" background-color="#ffffff" font-size="14px" font-weight="bold" margin="64px 0px 0px 0px">
            <re-heading margin="0px 0px 0px 0px" level="h1" align="left" color="#111827" font-size="24px" line-height="32px">
                Зарегистрируйтесь в {{app.name}}
            </re-heading>
            <re-text margin="16px 0px 0px 0px" align="left" font-size="14px" color="#747686" padding="15px 24px">
                Нажмите кнопку ниже, чтобы зарегистрироваться в {{app.name}}. Ссылка действительна {{ttl_minutes}} минут.
            </re-text>
            <re-button padding="6px 10px" href="{{magic_link}}" font-size="13px" border-radius="6px" margin="32px 0px 0px 0px" background-color="#131316" color="#ffffff">
                Зарегистрироваться
            </re-button>
            <re-text margin="16px 0px 64px 0px" font-size="14px" color="#747686">
                Если кнопка не работает, <a href="{{magic_link}}" style="color: #131316; text-decoration: underline;">нажмите здесь</a>.
            </re-text>
            <re-text margin="64px 0px 0px 0px" color="#747686" font-size="14px" padding="48px 32px">
                <b>Не запрашивали ссылку?</b>
            </re-text>
            <re-text font-size="14px" margin="4px 0px 0px 0px" color="#747686">
                Ссылка была запрошена с <b>{{requested_from}}</b> в <b>{{requested_at}}</b>. Если это были не вы — просто проигнорируйте это письмо.
            </re-text>
        </re-block>
    </re-main>
    <re-footer padding="24px 32px 48px">
        <re-divider background-color="#B7B8C2" height="1px"></re-divider>
        <re-text margin="16px 0px 0px 0px" font-size="13px" color="#747686">&copy; {{current_year}} {{app.name}}</re-text>
    </re-footer>
</re-body>
</re-html>
""",
    },
    "magic_link_user_profile": {
        "name": "Email link - Verify email",
        "subject": "Подтвердите ваш email",
        "body": """\
<re-html>
<re-head>
    <re-title>
        Подтвердите email для {{app.name}}
    </re-title>
</re-head>
<re-body background-color="#fff" padding="48px 32px 48px 32px">
    <re-preheader>
        Используйте ссылку ниже для подтверждения вашего email в {{app.name}}
    </re-preheader>
    <re-header padding="16px 32px 8px 32px">
        <re-text font-size="18px" font-weight="bold" line-height="26px" color="#111827">
            {{> app_logo}}
        </re-text>
    </re-header>
    <re-main background-color="#fff" border-radius="0px">
        <re-block border-radius="0px" align="left" padding="32px 32px 48px 32px" background-color="#ffffff" font-size="14px" font-weight="bold" margin="64px 0px 0px 0px">
            <re-heading margin="0px 0px 0px 0px" level="h1" align="left" color="#111827" font-size="24px" line-height="32px">
                Подтвердите ваш email для {{app.name}}
            </re-heading>
            <re-text margin="16px 0px 0px 0px" align="left" font-size="14px" color="#747686" padding="15px 24px">
                Нажмите кнопку ниже, чтобы подтвердить ваш email для {{app.name}}. Ссылка действительна {{ttl_minutes}} минут.
            </re-text>
            <re-button padding="6px 10px" href="{{magic_link}}" font-size="13px" border-radius="6px" margin="32px 0px 0px 0px" background-color="#131316" color="#ffffff">
                Подтвердить email
            </re-button>
            <re-text margin="16px 0px 64px 0px" font-size="14px" color="#747686">
                Если кнопка не работает, <a href="{{magic_link}}" style="color: #131316; text-decoration: underline;">нажмите здесь</a>.
            </re-text>
            <re-text margin="64px 0px 0px 0px" color="#747686" font-size="14px" padding="48px 32px">
                <b>Не запрашивали подтверждение?</b>
            </re-text>
            <re-text font-size="14px" margin="4px 0px 0px 0px" color="#747686">
                Ссылка была запрошена с <b>{{requested_from}}</b> в <b>{{requested_at}}</b>. Если это были не вы — просто проигнорируйте это письмо.
            </re-text>
        </re-block>
    </re-main>
    <re-footer padding="24px 32px 48px">
        <re-divider background-color="#B7B8C2" height="1px"></re-divider>
        <re-text margin="16px 0px 0px 0px" font-size="13px" color="#747686">&copy; {{current_year}} {{app.name}}</re-text>
    </re-footer>
</re-body>
</re-html>
""",
    },
}


def update_template(slug: str, name: str, subject: str, body: str) -> dict:
    """Send PUT /v1/templates/email/{slug} via curl (avoids WAF blocking urllib)."""
    payload = json.dumps({"name": name, "subject": subject, "body": body})
    result = subprocess.run(
        [
            "curl", "-s", "-w", "\nHTTP_STATUS:%{http_code}",
            "-H", f"Authorization: Bearer {SECRET_KEY}",
            "-H", "Content-Type: application/json",
            "-X", "PUT",
            f"{BASE_URL}/{slug}",
            "-d", payload,
        ],
        capture_output=True,
        text=True,
    )
    output = result.stdout
    # Split HTTP status from body
    if "\nHTTP_STATUS:" in output:
        body_part, status_part = output.rsplit("\nHTTP_STATUS:", 1)
        http_status = int(status_part.strip())
    else:
        body_part = output
        http_status = 0
    try:
        resp_body = json.loads(body_part)
    except json.JSONDecodeError:
        resp_body = body_part
    return {"slug": slug, "http_status": http_status, "response": resp_body}


if __name__ == "__main__":
    if not SECRET_KEY:
        print("ERROR: CLERK_SECRET_KEY not set")
        raise SystemExit(1)

    all_ok = True
    for slug, data in TEMPLATES.items():
        result = update_template(slug, data["name"], data["subject"], data["body"])
        status = result["http_status"]
        if status == 200:
            print(f"✓ {slug}: updated (subject: {data['subject']})")
        elif status == 423:
            print(f"✗ {slug}: HTTP 423 — template customization locked.")
            print("  → Contact Clerk support or enable Personal Pro to unlock.")
            all_ok = False
        else:
            print(f"✗ {slug}: HTTP {status} — {json.dumps(result['response'], ensure_ascii=False)}")
            all_ok = False

    if not all_ok:
        raise SystemExit(1)
    print("\nAll templates updated successfully.")
