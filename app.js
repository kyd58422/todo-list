const message = document.querySelector("#message");
const loggedOutArea = document.querySelector("#loggedOutArea");
const loggedInArea = document.querySelector("#loggedInArea");
const userEmail = document.querySelector("#userEmail");
const todoSection = document.querySelector("#todoSection");
const todoForm = document.querySelector("#todoForm");
const titleInput = document.querySelector("#titleInput");
const dueAtInput = document.querySelector("#dueAtInput");
const formTitle = document.querySelector("#formTitle");
const saveButton = document.querySelector("#saveButton");
const cancelEditButton = document.querySelector("#cancelEditButton");
const todoList = document.querySelector("#todoList");
const doneList = document.querySelector("#doneList");
let currentUser = null;
let editingTodoId = null;

function showMessage(text = "", isError = false) { message.textContent = text; message.classList.toggle("error", isError); }
function toLocalInputValue(iso) { const date = new Date(iso); const offset = date.getTimezoneOffset() * 60000; return new Date(date - offset).toISOString().slice(0, 16); }
function resetForm() { editingTodoId = null; todoForm.reset(); formTitle.textContent = "할 일 추가"; saveButton.textContent = "할 일 추가"; cancelEditButton.hidden = true; }
function setSignedInUser(user) { currentUser = user; const signedIn = Boolean(user); loggedOutArea.hidden = signedIn; loggedInArea.hidden = !signedIn; todoSection.hidden = !signedIn; userEmail.textContent = user?.email || ""; if (!signedIn) { todoList.replaceChildren(); doneList.replaceChildren(); resetForm(); } }
function formatDate(iso) { return new Intl.DateTimeFormat("ko-KR", { month:"long", day:"numeric", weekday:"short" }).format(new Date(iso)); }
function formatTime(iso) { return new Intl.DateTimeFormat("ko-KR", { hour:"2-digit", minute:"2-digit", hour12:false }).format(new Date(iso)); }
function dayKey(iso) { const date = new Date(iso); return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`; }

function createTodoCard(todo) {
  const card = document.createElement("article"); card.className = `todo-card ${todo.is_done ? "done-card" : ""}`;
  const check = document.createElement("input"); check.type = "checkbox"; check.className = "todo-check"; check.checked = todo.is_done; check.setAttribute("aria-label", `${todo.title} 완료 상태 변경`);
  check.addEventListener("change", () => updateDone(todo.id, check.checked));
  const details = document.createElement("div"); const title = document.createElement("p"); const time = document.createElement("p"); title.className = "todo-title"; time.className = "todo-time"; title.textContent = todo.title || "제목 없는 할 일"; time.textContent = formatTime(todo.due_at); details.append(title, time);
  const actions = document.createElement("div"); actions.className = "card-actions";
  const edit = document.createElement("button"); edit.type = "button"; edit.className = "icon-button"; edit.textContent = "수정"; edit.addEventListener("click", () => startEdit(todo));
  const remove = document.createElement("button"); remove.type = "button"; remove.className = "icon-button"; remove.textContent = "삭제"; remove.addEventListener("click", () => deleteTodo(todo)); actions.append(edit, remove); card.append(check, details, actions); return card;
}
function renderTodos(todos) {
  todoList.replaceChildren(); doneList.replaceChildren(); const pending = todos.filter((todo) => !todo.is_done); const completed = todos.filter((todo) => todo.is_done);
  document.querySelector("#todoCount").textContent = pending.length; document.querySelector("#doneCount").textContent = completed.length;
  [[pending, todoList, "등록된 할 일이 없습니다."], [completed, doneList, "완료한 할 일이 없습니다."]].forEach(([items, target, emptyText]) => {
    if (!items.length) { const empty = document.createElement("p"); empty.className = "empty"; empty.textContent = emptyText; target.append(empty); return; }
    const groups = new Map(); items.forEach((todo) => { const key = dayKey(todo.due_at); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(todo); });
    groups.forEach((group) => { const section = document.createElement("section"); section.className = "date-group"; const heading = document.createElement("div"); heading.className = "date-heading"; const label = document.createElement("strong"); const count = document.createElement("small"); label.textContent = formatDate(group[0].due_at); count.textContent = `${group.length}개`; heading.append(label, count); section.append(heading); group.forEach((todo) => section.append(createTodoCard(todo))); target.append(section); });
  });
}
async function loadTodos() { if (!currentUser) return; showMessage("할 일을 불러오는 중입니다."); const { data, error } = await sb.from("todos").select("id, title, is_done, due_at, user_id").order("due_at", { ascending:true }); if (error) { showMessage(`할 일을 불러오지 못했습니다: ${error.message}`, true); return; } renderTodos(data || []); showMessage(data?.length ? "" : "아직 등록된 할 일이 없습니다."); }
async function updateDone(id, isDone) { const { error } = await sb.from("todos").update({ is_done:isDone }).eq("id", id); if (error) { showMessage(`완료 상태를 바꾸지 못했습니다: ${error.message}`, true); await loadTodos(); return; } showMessage(isDone ? "Done으로 이동했습니다." : "Will be로 되돌렸습니다."); loadTodos(); }
function startEdit(todo) { editingTodoId = todo.id; titleInput.value = todo.title || ""; dueAtInput.value = toLocalInputValue(todo.due_at); formTitle.textContent = "할 일 수정"; saveButton.textContent = "수정 저장"; cancelEditButton.hidden = false; titleInput.focus(); window.scrollTo({ top: todoForm.offsetTop - 20, behavior:"smooth" }); }
async function deleteTodo(todo) { if (!window.confirm(`“${todo.title || "이 할 일"}”을 삭제할까요?`)) return; const { error } = await sb.from("todos").delete().eq("id", todo.id); if (error) { showMessage(`삭제하지 못했습니다: ${error.message}`, true); return; } showMessage("할 일을 삭제했습니다."); loadTodos(); }

document.querySelector("#signUpForm").addEventListener("submit", async (event) => { event.preventDefault(); const form = event.currentTarget; const { error, data } = await sb.auth.signUp({ email:form.elements.email.value.trim(), password:form.elements.password.value }); if (error) { showMessage(`회원가입에 실패했습니다: ${error.message}`, true); return; } form.reset(); showMessage(data.session ? "회원가입과 로그인이 완료되었습니다." : "회원가입 요청을 보냈습니다. 이메일 인증 후 로그인해 주세요."); });
document.querySelector("#signInForm").addEventListener("submit", async (event) => { event.preventDefault(); const form = event.currentTarget; const { error } = await sb.auth.signInWithPassword({ email:form.elements.email.value.trim(), password:form.elements.password.value }); if (error) { showMessage(`로그인에 실패했습니다: ${error.message}`, true); return; } form.reset(); showMessage("로그인했습니다."); });
document.querySelector("#signOutButton").addEventListener("click", async () => { const { error } = await sb.auth.signOut(); showMessage(error ? `로그아웃에 실패했습니다: ${error.message}` : "로그아웃했습니다.", Boolean(error)); });
todoForm.addEventListener("submit", async (event) => { event.preventDefault(); if (!currentUser) return; const values = { title:titleInput.value.trim(), due_at:new Date(dueAtInput.value).toISOString() }; if (!values.title) return; let error; if (editingTodoId) ({ error } = await sb.from("todos").update(values).eq("id", editingTodoId)); else ({ error } = await sb.from("todos").insert({ ...values, user_id:currentUser.id, is_done:false })); if (error) { showMessage(`저장하지 못했습니다: ${error.message}`, true); return; } showMessage(editingTodoId ? "할 일을 수정했습니다." : "할 일을 추가했습니다."); resetForm(); loadTodos(); });
cancelEditButton.addEventListener("click", resetForm);
sb.auth.onAuthStateChange((_event, session) => { setSignedInUser(session?.user || null); if (session?.user) loadTodos(); });
(async function restoreSession() { const { data, error } = await sb.auth.getSession(); if (error) { showMessage("로그인 상태를 확인하지 못했습니다.", true); return; } setSignedInUser(data.session?.user || null); if (data.session?.user) loadTodos(); })();
