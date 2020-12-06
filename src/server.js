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
  let config = getSuspense(`/${waiver}/get_config`);
  config.initialValues = Object.fromEntries(
    Object.values(config.steps)
      .map((step) =>
        Object.entries(step.fields).map(([name, field]) => [
          name,
          field.multiple ? [] : "",
        ])
      )
      .flat()
  );
  return config;
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

export async function get_submissions(waiver, where) {
  let qs = new URLSearchParams(where);
  let submissions = await get(`/${waiver}/get_submissions?${qs}`);
  let config = get_config(waiver);
  for (let sub of submissions)
    for (let [name, value] of Object.entries(sub.values))
      sub.values[name] = Array.isArray(config.initialValues[name])
        ? value.split(",")
        : value;
  return submissions;
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
