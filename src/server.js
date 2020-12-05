export async function login() {
  let auth = await getAuth();
  let user = await auth.signIn();
  let token = user.getAuthResponse().id_token;
  let body = toFormData({ token });
  await fetch("/login", {
    method: "POST",
    body,
  });
  _cache = {};
}

export async function logout() {
  let auth = await getAuth();
  auth.signOut();
  await fetch("/logout", {
    method: "POST",
  });
  _cache = {};
}

function getAuth() {
  return new Promise((resolve) =>
    window.gapi.load("auth2", () => resolve(window.gapi.auth2.init()))
  );
}

export function get_user() {
  return getSuspense("/get_user");
}

export function get_configs() {
  return getSuspense("/get_configs");
}

export function get_config(waiver) {
  return getSuspense(`/${waiver}/get_config`);
}

export function getBasePdf(url) {
  return getCached(url, asArrayBuffer);
}

export function submit_waiver(waiver, pdfBytes, values) {
  let pdf = new Blob([pdfBytes], { type: "application/pdf" });
  let formData = toFormData({ ...values, pdf });
  return fetch(`/${waiver}/submit`, {
    method: "POST",
    body: formData,
  }).then((resp) => resp.json());
}

export function record_use(waiver, id) {
  return fetch(`/${waiver}/${id}/record_use`, {
    method: "POST",
  }).then((resp) => resp.json());
}

export function get_submissions(waiver, where) {
  return get(`/${waiver}/get_submissions?${new URLSearchParams(where)}`);
}

///////////////////////////////////////////////////////////////////////////////////////////////////

function get(url, as = asJson) {
  return fetch(url).then(as);
}
let asJson = (resp) => resp.json();
let asArrayBuffer = (resp) => resp.arrayBuffer();

function getCached(url, ...args) {
  if (!_cache[url]) _cache[url] = get(url, ...args);
  return _cache[url];
}
let _cache = {};

function getSuspense(url, ...args) {
  let promise = getCached(url, ...args);
  if (promise.value !== undefined) return promise.value;
  promise.then((value) => (promise.value = value));
  throw promise;
}

function toFormData(obj) {
  let formData = new FormData();
  for (let [key, value] of Object.entries(obj)) {
    if (value == null || value.length === 0) continue;
    // valueOf converts date/moment to millis
    formData.set(key, value.valueOf());
  }
  return formData;
}
