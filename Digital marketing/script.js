const WHATSAPP_NUMBER = "255613520003";
const EMAILJS_SERVICE_ID = "";
const EMAILJS_TEMPLATE_ID = "";
const EMAILJS_PUBLIC_KEY = "";

const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const contactForm = document.querySelector("#contact-form");
const formStatus = document.querySelector("#form-status");
const galleryInput = document.querySelector("#gallery-upload");
const galleryPreview = document.querySelector("#gallery-preview");
const galleryStatus = document.querySelector("#gallery-status");
const contactMediaInput = document.querySelector("#contact-media");
const contactMediaPreview = document.querySelector("#contact-media-preview");
const contactMediaStatus = document.querySelector("#contact-media-status");
const maxMediaFiles = 6;
const maxMediaFileSize = 20 * 1024 * 1024;
let galleryMedia = [];
let contactMedia = [];
let nextMediaId = 0;

function validateMediaFiles(fileList, statusElement) {
  const files = Array.from(fileList);

  if (files.length > maxMediaFiles) {
    statusElement.textContent = `Chagua faili zisizozidi ${maxMediaFiles} kwa wakati mmoja.`;
    return null;
  }

  const invalidFile = files.find((file) => {
    return (!file.type.startsWith("image/") && !file.type.startsWith("video/")) ||
      file.size > maxMediaFileSize;
  });

  if (invalidFile) {
    statusElement.textContent = invalidFile.size > maxMediaFileSize
      ? `${invalidFile.name} ni kubwa kuliko MB 20. Chagua faili ndogo zaidi.`
      : `${invalidFile.name} si picha au video inayokubalika.`;
    return null;
  }

  statusElement.textContent = "";
  return files.map((file) => ({
    id: nextMediaId++,
    file,
    url: URL.createObjectURL(file)
  }));
}

function renderMedia(entries, container, onRemove) {
  entries.forEach((entry) => {
    const item = document.createElement("article");
    item.className = "media-item";

    const media = document.createElement(entry.file.type.startsWith("video/") ? "video" : "img");
    media.className = "media-preview";
    media.src = entry.url;

    if (media instanceof HTMLVideoElement) {
      media.controls = true;
      media.preload = "metadata";
      media.playsInline = true;
      media.setAttribute("aria-label", `Preview ya video: ${entry.file.name}`);
    } else {
      media.alt = `Preview ya picha: ${entry.file.name}`;
      media.loading = "lazy";
    }

    const caption = document.createElement("div");
    caption.className = "media-caption";
    const name = document.createElement("span");
    name.textContent = entry.file.name;
    const removeButton = document.createElement("button");
    removeButton.className = "media-remove";
    removeButton.type = "button";
    removeButton.textContent = "Ondoa";
    removeButton.setAttribute("aria-label", `Ondoa ${entry.file.name}`);
    removeButton.addEventListener("click", () => onRemove(entry.id));

    caption.append(name, removeButton);
    item.append(media, caption);
    container.append(item);
  });
}

function removeMediaEntry(entries, id) {
  const removed = entries.find((entry) => entry.id === id);
  if (removed) URL.revokeObjectURL(removed.url);
  return entries.filter((entry) => entry.id !== id);
}

function renderGalleryMedia() {
  galleryPreview.replaceChildren();
  renderMedia(galleryMedia, galleryPreview, (id) => {
    galleryMedia = removeMediaEntry(galleryMedia, id);
    renderGalleryMedia();
  });
}

function renderContactMedia() {
  contactMediaPreview.replaceChildren();
  renderMedia(contactMedia, contactMediaPreview, (id) => {
    contactMedia = removeMediaEntry(contactMedia, id);
    renderContactMedia();
  });
}

galleryInput.addEventListener("change", () => {
  const selected = validateMediaFiles(galleryInput.files, galleryStatus);
  galleryInput.value = "";
  if (!selected) return;

  galleryMedia.forEach((entry) => URL.revokeObjectURL(entry.url));
  galleryMedia = selected;
  renderGalleryMedia();
});

contactMediaInput.addEventListener("change", () => {
  const selected = validateMediaFiles(contactMediaInput.files, contactMediaStatus);
  contactMediaInput.value = "";
  if (!selected) return;

  contactMedia.forEach((entry) => URL.revokeObjectURL(entry.url));
  contactMedia = selected;
  renderContactMedia();
});

menuToggle.addEventListener("click", () => {
  const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isExpanded));
  menuToggle.setAttribute("aria-label", isExpanded ? "Fungua menyu" : "Funga menyu");
  navLinks.classList.toggle("is-open", !isExpanded);
});

navLinks.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Fungua menyu");
    navLinks.classList.remove("is-open");
  }
});

contactForm.addEventListener("submit", (event) => {
  event.preventDefault();
  formStatus.textContent = "";
  formStatus.classList.remove("is-success");

  const formData = new FormData(contactForm);
  const name = formData.get("name").toString().trim();
  const business = formData.get("business").toString().trim();
  const customerEmail = formData.get("customer_email").toString().trim();
  const message = formData.get("message").toString().trim();
  const mediaNames = contactMedia.map((entry) => entry.file.name);
  const body = [
    "Habari Milenium Digital Solutions, naomba makadirio ya tovuti.",
    `Jina: ${name}`,
    business ? `Aina ya biashara: ${business}` : "",
    customerEmail ? `Barua pepe ya mteja: ${customerEmail}` : "",
    `Mahitaji: ${message}`,
    mediaNames.length ? `Picha/video nilizochagua: ${mediaNames.join(", ")}. Nitaziambatisha kwenye WhatsApp.` : ""
  ].filter(Boolean).join("\n");

  if (event.submitter && event.submitter.value === "email") {
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      formStatus.textContent = "Email bado haijaunganishwa. Weka EmailJS Service ID, Template ID na Public Key kwenye script.js.";
      return;
    }

    if (!window.emailjs) {
      formStatus.textContent = "Huduma ya email haikupatikana. Hakikisha intaneti inafanya kazi kisha jaribu tena.";
      return;
    }

    const emailButton = event.submitter;
    emailButton.disabled = true;
    emailButton.textContent = "Inatuma email...";
    Promise.resolve().then(() => {
      window.emailjs.init({
        publicKey: EMAILJS_PUBLIC_KEY,
        limitRate: { id: "milenium-contact-form", throttle: 10000 }
      });

      return window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        name,
        business: business || "Haijaainishwa",
        customer_email: customerEmail || "Haijawekwa",
        message,
        media_names: mediaNames.length ? mediaNames.join(", ") : "Hakuna",
        submitted_at: new Date().toLocaleString("sw-TZ")
      });
    }).then(() => {
      formStatus.textContent = "Email imetumwa kikamilifu. Tutawasiliana nawe hivi karibuni.";
      formStatus.classList.add("is-success");
      contactForm.reset();
      contactMedia.forEach((entry) => URL.revokeObjectURL(entry.url));
      contactMedia = [];
      renderContactMedia();
    }).catch((error) => {
      console.error("EmailJS send failed:", error);
      formStatus.textContent = `Email haikutumwa: ${error instanceof Error ? error.message : String(error)}. Tafadhali jaribu tena au tumia WhatsApp.`;
    }).finally(() => {
      emailButton.disabled = false;
      emailButton.innerHTML = 'Tuma kwa barua pepe <span aria-hidden="true">↗</span>';
    });
    return;
  }

  if (!WHATSAPP_NUMBER) {
    formStatus.textContent = "Fomu iko tayari, lakini namba ya WhatsApp ya biashara haijawekwa.";
    return;
  }

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(body)}`, "_blank", "noopener,noreferrer");
  if (mediaNames.length) formStatus.textContent = "Ujumbe umefunguka WhatsApp. Tafadhali ambatisha picha/video zako kabla ya kutuma.";
});

window.addEventListener("beforeunload", () => {
  [...galleryMedia, ...contactMedia].forEach((entry) => URL.revokeObjectURL(entry.url));
});

document.querySelector("#year").textContent = new Date().getFullYear();
