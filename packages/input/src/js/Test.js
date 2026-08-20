import { confirm, prompt } from "https://esm.sh/@t007/dialog@latest";
import toast from "https://esm.sh/@t007/toast@latest";
import { formatHTML, highlightHTML, highlightJSON } from "../../../../assets/scripts/formatter.js";

window.onload = () =>
  toast.info("This is a Form Builder to test my Custom Form Library", {
    image: "../../../assets/images/my_profile_s.jpeg",
  });

const dropZone = document.getElementById("dropZone");
let draggedType = null;

document.querySelectorAll(".draggable").forEach((item) => {
  item.addEventListener("dragstart", (e) => {
    draggedType = e.target.dataset.type;
  });
  item.addEventListener("dragend", () => {
    dropZone.classList.remove("dragover");
  });
});

dropZone.addEventListener("dragenter", () => draggedType && dropZone.classList.add("dragover"));
dropZone.addEventListener("dragleave", () => draggedType && dropZone.classList.add("dragover"));
dropZone.addEventListener("dragover", (e) => e.preventDefault());

dropZone.addEventListener("drop", async (e) => {
  e.preventDefault();
  if (!draggedType) return;
  dropZone.classList.remove("dragover");

  const label = await prompt("Enter label for this field:", draggedType.charAt(0).toUpperCase() + draggedType.slice(1));
  if (!label) return (draggedType = null);

  const required = await confirm("Make this field required?");
  let placeholder = /^(textarea|text|email|password)$/.test(draggedType) ? await prompt("Enter placeholder (optional):", "") : "";

  let options = [];
  if (/^(select|radio|checkbox)$/.test(draggedType)) {
    const opts = await prompt("Enter comma-separated options:", "Option 1,Option 2,Option 3");
    if (!opts) return;
    options = opts
      .split(",")
      .map((opt) => opt.trim())
      .filter(Boolean);
    if (options.length === 0) return;
  }

  const fieldEl = fieldElement(draggedType, label, required, placeholder, options);
  addDragReorderHandlers(fieldEl);
  dropZone.appendChild(fieldEl);
  draggedType = null;
});

function fieldElement(type, labelText, required, placeholder = "", options = []) {
  const id = `field-${Date.now()}`;
  const div = document.createElement("div");
  div.className = "form-field";
  div.dataset.type = type;
  div.dataset.id = id;
  div.draggable = true;

  let fieldEl = "";
  if (type === "radio" || type === "checkbox") {
    for (const option of options) {
      fieldEl += field({
        type,
        name: labelText,
        label: option,
        value: option,
        required,
        placeholder,
      }).outerHTML;
    }
  } else {
    fieldEl = field({
      type,
      label: labelText,
      name: labelText,
      required,
      placeholder,
      options,
    }).outerHTML;
  }

  div.innerHTML = `
    <div class="form-actions">
        <button type="button" onclick="toggleCollapse(this)" title="Collapse field">⬆️</button>
        <button type="button" onclick="editField('${id}')" title="Edit field">✏️</button>
        <button type="button" onclick="cloneField('${id}')" title="Clone field">➕</button>
        <button type="button" onclick="removeField('${id}')" title="Delete field">🗑️</button>
    </div>
    <label class="content-label">${labelText}</label>
    ${fieldEl}
    <div class="field-preview">Preview: ${type} field</div>
  `;
  addAutoSaveListeners(div);
  return div;
}

window.removeField = function removeField(id) {
  const field = document.querySelector(`[data-id='${id}']`);
  if (field) field.remove();
};

window.editField = async function editField(id) {
  const field = document.querySelector(`[data-id='${id}']`);
  if (!field) return;

  const type = field.dataset.type;
  const labelEl = field.querySelector("label.content-label");
  const labelText = await prompt("Edit label:", labelEl.textContent.trim());
  if (!labelText) return;

  let placeholder = "";
  if (/^(text|email|password|textarea)$/.test(type)) {
    const input = field.querySelector("input, textarea");
    placeholder = await prompt("Edit placeholder (optional):", input.placeholder || "");
    input.placeholder = placeholder;
  }

  const required = await confirm("Should this field be required?");

  if (/^(select|radio|checkbox)$/.test(type)) {
    const currentOptions = Array.from(field.querySelectorAll("option,input")).map((el) => el.value || el.textContent);
    const newOptions = await prompt("Edit options (comma-separated):", currentOptions.join(", "));
    if (newOptions) {
      const options = newOptions
        .split(",")
        .map((opt) => opt.trim())
        .filter(Boolean);

      if (type === "select") {
        const select = field({
          type,
          label: labelText,
          name: labelText,
          required,
          placeholder,
          options,
        });
        field.querySelector("select")?.replaceWith(select);
      } else {
        let group = "";
        for (const option of options) {
          group += field({
            type,
            name: labelText,
            label: option,
            value: option,
            required,
            placeholder,
          }).outerHTML;
        }
        field.querySelectorAll(".field").forEach((el) => el.remove());
        field.insertAdjacentHTML("beforeend", group);
      }
    }
  } else {
    const input = field.querySelector("input, textarea");
    input.required = required;
  }

  labelEl.textContent = labelText;
};

window.cloneField = function cloneField(id) {
  const field = document.querySelector(`[data-id='${id}']`);
  if (!field) return;

  const type = field.dataset.type;
  const label = field.querySelector("label").textContent.trim();
  const isRequired = field.innerHTML.includes("required");
  const placeholder = field.querySelector("input, textarea")?.placeholder || "";

  let options = [];
  if (/^(select|radio|checkbox)$/.test(type)) {
    const inputs = field.querySelectorAll("input, option");
    options = [...inputs].map((i) => i.value).filter(Boolean);
  }

  const cloned = fieldElement(type, label, isRequired, placeholder, options);
  addDragReorderHandlers(cloned);
  dropZone.insertBefore(cloned, field.nextSibling);
};

window.toggleCollapse = function toggleCollapse(btn) {
  const field = btn.closest(".form-field");
  const label = field.querySelector("label");
  const preview = field.querySelector(".field-preview");

  const contentEls = [...field.children].filter((el) => !el.classList.contains("form-actions") && el !== label && el !== preview);

  const collapsed = btn.textContent === "⬇️";
  contentEls.forEach((el) => (el.style.display = collapsed ? "" : "none"));
  btn.textContent = collapsed ? "⬆️" : "⬇️";

  field.dataset.collapsed = collapsed ? "false" : "true";
};

window.copyExportedCode = function copyExportedCode() {
  const text = document.getElementById("output").dataset.code;
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success("Exported Code Copied to Clipboard", { tag: "export-copy" }))
      .catch((err) => toast.error("Could not copy Exported Code to Clipboard", { tag: "export-no-copy" }));
  } else {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
};

function getFieldsHTML() {
  const formFields = [...dropZone.querySelectorAll(".t007-input-field")];
  const formHTML = formFields.map((field) => field.outerHTML).join("");
  return formatHTML(formHTML);
}

window.exportFormHTML = function exportFormHTML() {
  const HTML = getFieldsHTML();
  document.getElementById("output").dataset.code = HTML;
  document.getElementById("output").innerHTML = highlightHTML(HTML);
  toast.success("Exported HTML Code Below", { tag: "export-HTML" });
};

function getFieldsData() {
  const fields = [...dropZone.children].map((field) => {
    return {
      id: field.dataset.id,
      type: field.dataset.type,
      label: field.querySelector("label").textContent,
      required: field.querySelector("[required]") !== null,
      placeholder: field.querySelector("input, textarea")?.placeholder || "",
      options: field.dataset.type === "select" ? Array.from(field.querySelectorAll("option")).map((opt) => opt.textContent) : Array.from(field.querySelectorAll("input[type=radio], input[type=checkbox]")).map((input) => input.value),
      collapsed: field.dataset.collapsed === "true",
    };
  });
  return fields;
}

window.exportFormJSON = function exportFormJSON() {
  const data = getFieldsData();
  data.forEach((datum) => {
    delete datum.id;
    delete datum.collapsed;
    if (datum.type !== "select") delete datum.options;
  });
  const json = JSON.stringify(data, null, 2);
  document.getElementById("output").dataset.code = json;
  document.getElementById("output").innerHTML = highlightJSON(json);
  toast.success("Exported JSON Code Below", { tag: "export-JSON" });
};

window.saveToLocal = function saveToLocal(e) {
  localStorage.setItem("t007SavedForm", JSON.stringify(getFieldsData()));
  if (document.activeElement.tagName == "BUTTON") {
    toast.success("Saved Session to Local Storage", { tag: "save" });
  }
};

window.loadFromLocal = function loadFromLocal() {
  const json = localStorage.getItem("t007SavedForm");
  if (!json) return;
  const fields = JSON.parse(json);
  dropZone.innerHTML = "";
  fields.forEach((f) => {
    const el = fieldElement(f.type, f.label, f.required, f.placeholder || "", f.options || []);
    addDragReorderHandlers(el);
    addAutoSaveListeners(el);
    dropZone.appendChild(el);
    if (f.collapsed) {
      const btn = el.querySelector(".form-actions button");
      toggleCollapse(btn);
    }
  });
  toast.success("Loaded session from Local Storage", { tag: "load" });
};

window.submitForm = function submitForm() {
  toast.info("Simulating Form Submission", { tag: "submit" });
};

window.resetForm = function submitForm() {
  toast.success("Provided Form Data Removed", { tag: "reset" });
};

function addAutoSaveListeners(fieldEl) {
  fieldEl.querySelectorAll("input, textarea, select").forEach((input) => {
    input.addEventListener("input", saveToLocal);
    input.addEventListener("change", saveToLocal);
  });
}

function addDragReorderHandlers(el) {
  el.addEventListener("dragstart", () => el.classList.add("dragging"));
  el.addEventListener("dragend", () => el.classList.remove("dragging"));
}

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  if (!e.target.classList.contains("form-field")) return;
  const afterElement = getDragAfterElement(dropZone, e.clientY);
  const dragging = document.querySelector(".form-field.dragging");
  if (!dragging) return;
  if (afterElement == null) {
    dropZone.appendChild(dragging);
  } else {
    dropZone.insertBefore(dragging, afterElement);
  }
});

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll(".form-field:not(.dragging)")];
  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}

const outputBox = document.querySelector(".output-box");
window.toggleWrapExportedCode = function toggleWrapExportedCode() {
  const { whiteSpace } = getComputedStyle(outputBox);
  outputBox.style.whiteSpace = whiteSpace === "pre" ? "pre-wrap" : "pre";
};
