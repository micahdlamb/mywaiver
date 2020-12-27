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

// ------------------------------------------------------------------------------------------------

export function get_my_template_names() {
  return getSuspense("/get_my_template_names");
}

export function get_demo_template_names() {
  return getSuspense("/get_demo_template_names");
}

export function get_template_pdf(template) {
  return getCached(`/${template}/get_template_pdf`, asArrayBuffer);
}

export function get_template_config(template) {
  return getSuspense(`/${template}/get_template_config`, async (resp) => {
    let config = await resp.json();
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
    config.reuseFields = Object.values(config.steps)
      .map((step) =>
        Object.entries(step.fields)
          .filter(([name, field]) => field.reuse)
          .map(([name, field]) => name)
      )
      .flat();
    return config;
  });
}

export function get_template(template) {
  return getSuspense(`/${template}/get_template`);
}

export async function create_template(name, pdf, config) {
  let formData = toFormData({ name, pdf, config: JSON.stringify(config) });
  await fetch("/create_template", {
    method: "POST",
    body: formData,
  });
  _cache = {};
}

export async function update_template(template, name, pdf, config) {
  let formData = toFormData({ name, pdf, config: JSON.stringify(config) });
  await fetch(`/${template}/update_template`, {
    method: "POST",
    body: formData,
  }).then((resp) => resp.json());
  _cache = {};
}

// ------------------------------------------------------------------------------------------------

export function submit(template, pdfBytes, values) {
  let pdf = new Blob([pdfBytes], { type: "application/pdf" });
  let formData = toFormData({ ...values, pdf });
  return fetch(`/${template}/submit`, {
    method: "POST",
    body: formData,
  }).then((resp) => resp.json());
}

export async function get_submissions(template, where) {
  let qs = new URLSearchParams(where);
  let submissions = await get(`/${template}/get_submissions?${qs}`);
  _fixTypes(template, submissions);
  return submissions;
}

export async function search_submissions(template, query) {
  let qs = query ? new URLSearchParams({query: query+'%'}) : '';
  let submissions = await get(`/${template}/search_submissions?${qs}`);
  _fixTypes(template, submissions);
  return submissions;
}

function _fixTypes(template, submissions) {
  let config = get_template_config(template);
  for (let sub of submissions)
    for (let [name, value] of Object.entries(sub.values))
      sub.values[name] = Array.isArray(config.initialValues[name])
        ? value.split(",")
        : value;
}

export function get_submission_pdf_url(template, id) {
  return `/${template}/${id}/get_submission_pdf`;
}

export function record_use(template, id) {
  return fetch(`/${template}/${id}/record_use`, {
    method: "POST",
  }).then((resp) => resp.json());
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
