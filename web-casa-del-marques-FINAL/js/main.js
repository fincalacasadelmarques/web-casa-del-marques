/* Casa del Marqués — comportamiento de la web (sin dependencias) */
(function () {
  "use strict";
  var raiz = document.body.getAttribute("data-raiz") || "";

  /* --- Menú móvil --- */
  var boton = document.querySelector(".boton-menu");
  var nav = document.querySelector(".nav");
  if (boton && nav) {
    var ponerMenu = function (abierto) {
      nav.classList.toggle("abierto", abierto);
      boton.setAttribute("aria-expanded", abierto ? "true" : "false");
      boton.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
    };
    boton.addEventListener("click", function () {
      ponerMenu(!nav.classList.contains("abierto"));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) ponerMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") ponerMenu(false);
    });
  }

  /* --- Fotos: si una foto aún no existe, se muestra un fondo elegante --- */
  function prepararFoto(img) {
    var marco = img.closest(".foto, .foto-fondo");
    function ok() { if (marco) marco.classList.add("cargada"); }
    function mal() { img.classList.add("falta"); }
    if (img.complete) { img.naturalWidth ? ok() : mal(); }
    img.addEventListener("load", ok);
    img.addEventListener("error", mal);
  }
  document.querySelectorAll(".foto img, .foto-fondo img").forEach(prepararFoto);

  /* Logo: si existe img/logo.png se usa; si no, se ve el nombre en texto */
  var logoImg = document.querySelector(".logo img");
  if (logoImg) {
    var mostrar = function () { logoImg.closest(".logo").classList.add("tiene-imagen"); };
    var quitar = function () { logoImg.remove(); };
    if (logoImg.complete) { logoImg.naturalWidth ? mostrar() : quitar(); }
    else { logoImg.addEventListener("load", mostrar); logoImg.addEventListener("error", quitar); }
  }

  /* --- Aparición suave al hacer scroll --- */
  if ("IntersectionObserver" in window) {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll(".aparece").forEach(function (el) { obs.observe(el); });
  } else {
    document.querySelectorAll(".aparece").forEach(function (el) { el.classList.add("visible"); });
  }

  /* --- Galería con filtros y visor --- */
  var galeria = document.getElementById("galeria");
  if (galeria && window.FOTOS_GALERIA) {
    var fotos = window.FOTOS_GALERIA;
    fotos.forEach(function (f, i) {
      var b = document.createElement("button");
      b.className = "foto";
      b.type = "button";
      b.dataset.categoria = f.categoria;
      b.dataset.indice = i;
      b.setAttribute("aria-label", "Ampliar foto: " + f.texto);
      b.setAttribute("data-nombre", f.texto);
      var img = document.createElement("img");
      img.src = raiz + "img/galeria/" + f.archivo;
      img.alt = f.texto + " — Casa del Marqués";
      img.loading = "lazy";
      b.appendChild(img);
      galeria.appendChild(b);
      prepararFoto(img);
    });

    var filtros = document.querySelectorAll(".filtros button");
    function filtrar(cat) {
      filtros.forEach(function (x) { x.setAttribute("aria-pressed", x.dataset.filtro === cat ? "true" : "false"); });
      galeria.querySelectorAll("button").forEach(function (b) {
        b.classList.toggle("oculto", cat !== "todas" && b.dataset.categoria !== cat);
      });
    }
    filtros.forEach(function (btn) { btn.addEventListener("click", function () { filtrar(btn.dataset.filtro); }); });
    var inicial = (location.hash || "").replace("#", "");
    if (inicial && document.querySelector('.filtros [data-filtro="' + inicial + '"]')) filtrar(inicial);

    var visor = document.querySelector(".visor");
    var vImg = visor.querySelector("img");
    var vPie = visor.querySelector(".pie");
    var actual = 0;
    function visibles() { return Array.prototype.filter.call(galeria.querySelectorAll("button"), function (b) { return !b.classList.contains("oculto"); }); }
    function abrir(i) {
      actual = i;
      var f = fotos[i];
      vImg.src = raiz + "img/galeria/" + f.archivo;
      vImg.alt = f.texto;
      vPie.textContent = f.texto;
      visor.classList.add("abierto");
      document.body.style.overflow = "hidden";
      visor.querySelector(".cerrar").focus();
    }
    function cerrar() { visor.classList.remove("abierto"); document.body.style.overflow = ""; }
    function mover(d) {
      var lista = visibles();
      var pos = lista.findIndex(function (b) { return +b.dataset.indice === actual; });
      var sig = lista[(pos + d + lista.length) % lista.length];
      if (sig) abrir(+sig.dataset.indice);
    }
    galeria.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (b) abrir(+b.dataset.indice);
    });
    visor.querySelector(".cerrar").addEventListener("click", cerrar);
    visor.querySelector(".ant").addEventListener("click", function () { mover(-1); });
    visor.querySelector(".sig").addEventListener("click", function () { mover(1); });
    visor.addEventListener("click", function (e) { if (e.target === visor) cerrar(); });
    document.addEventListener("keydown", function (e) {
      if (!visor.classList.contains("abierto")) return;
      if (e.key === "Escape") cerrar();
      if (e.key === "ArrowLeft") mover(-1);
      if (e.key === "ArrowRight") mover(1);
    });
  }

  /* --- Todos los formularios: página de "gracias" en este mismo dominio y fechas desde hoy --- */
  document.querySelectorAll("form").forEach(function (f) {
    var n = f.querySelector('[name="_next"]');
    if (n && /^https?:/.test(location.protocol)) n.value = new URL(raiz + "gracias/", location.href).href;
    var hoy = new Date().toISOString().slice(0, 10);
    f.querySelectorAll('input[type="date"]').forEach(function (d) { d.min = hoy; });
  });

  /* --- Formulario de consulta --- */
  var form = document.getElementById("form-consulta");
  if (form) {
    var tipo = form.querySelector('[name="Tipo de consulta"]');
    var casa = form.querySelector(".solo-casa");
    var evento = form.querySelector(".solo-evento");
    function actualizar() {
      var v = tipo.value;
      if (casa) casa.hidden = v !== "Casa rural";
      if (evento) evento.hidden = !(v === "Evento" || v === "Catering");
    }
    var param = new URLSearchParams(location.search).get("tipo");
    if (param) {
      var mapa = { evento: "Evento", casa: "Casa rural", catering: "Catering" };
      if (mapa[param]) tipo.value = mapa[param];
    }
    tipo.addEventListener("change", actualizar);
    actualizar();

    /* Página de "gracias" tras enviar */
    var next = form.querySelector('[name="_next"]');
    if (next && /^https?:/.test(location.protocol)) {
      next.value = new URL(raiz + "gracias/", location.href).href;
    }

    /* Fecha mínima = hoy */
    var hoy = new Date().toISOString().slice(0, 10);
    form.querySelectorAll('input[type="date"]').forEach(function (d) { d.min = hoy; });

    /* Botón "enviar por WhatsApp" con los datos del formulario */
    var wa = document.getElementById("enviar-whatsapp");
    if (wa) {
      wa.addEventListener("click", function () {
        var datos = new FormData(form);
        var lineas = ["Hola, quería pedir información sobre la Casa del Marqués."];
        ["Tipo de consulta", "Tipo de evento", "Fecha", "Fecha de salida", "Personas", "Nombre", "Mensaje"].forEach(function (k) {
          var v = (datos.get(k) || "").toString().trim();
          if (v) lineas.push(k + ": " + v);
        });
        window.open("https://wa.me/34679257317?text=" + encodeURIComponent(lineas.join("\n")), "_blank", "noopener");
      });
    }
  }

  /* Año actual en el pie */
  var anio = document.getElementById("anio");
  if (anio) anio.textContent = new Date().getFullYear();
})();
