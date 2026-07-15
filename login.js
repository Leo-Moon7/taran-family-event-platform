const authTabs = [...document.querySelectorAll("[data-auth-tab]")];
const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");

function selectAuthTab(name) {
  authTabs.forEach(tab => tab.classList.toggle("is-active", tab.dataset.authTab === name));
  loginForm.hidden = name !== "login";
  registerForm.hidden = name !== "register";
}

authTabs.forEach(tab => tab.addEventListener("click", () => selectAuthTab(tab.dataset.authTab)));
if (new URLSearchParams(window.location.search).get("mode") === "register") selectAuthTab("register");

function returnPath() {
  return window.SonpumAuth.safeReturnPath(new URLSearchParams(window.location.search).get("return") || "account.html");
}

loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  const error = document.querySelector("#login-error");
  error.textContent = "";
  try {
    await window.SonpumAuth.api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: document.querySelector("#login-email").value.trim(), password: document.querySelector("#login-password").value })
    });
    window.location.href = returnPath();
  } catch (requestError) {
    error.textContent = requestError.message;
  }
});

registerForm.addEventListener("submit", async event => {
  event.preventDefault();
  const error = document.querySelector("#register-error");
  const password = document.querySelector("#register-password").value;
  error.textContent = "";
  if (password !== document.querySelector("#register-password-confirm").value) {
    error.textContent = "비밀번호 확인이 일치하지 않습니다.";
    return;
  }
  if (!document.querySelector("#register-consent").checked) {
    error.textContent = "필수 정보 수집·이용에 동의해주세요.";
    return;
  }
  try {
    await window.SonpumAuth.api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ display_name: document.querySelector("#register-name").value.trim(), email: document.querySelector("#register-email").value.trim(), password })
    });
    window.location.href = returnPath();
  } catch (requestError) {
    error.textContent = requestError.message;
  }
});
