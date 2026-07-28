"use strict";
(() => {
  // src/utils/dom/cleanHtml.js
  function cleanHtml(element, {
    removeAttributes = true,
    removeComments = false,
    compress = true,
    removeStyle = false,
    removeScript = false,
    keepAttributes = {},
    flatten,
    content = []
  } = {}) {
    const raiz = element.cloneNode(true);
    const etiquetasContenido = [...content.map((x) => x.toUpperCase()), "BR"];
    if (removeStyle) {
      raiz.querySelectorAll("style").forEach((elemento) => elemento.remove());
    }
    if (removeScript) {
      raiz.querySelectorAll("script").forEach((elemento) => elemento.remove());
    }
    if (removeAttributes) {
      raiz.querySelectorAll("*").forEach((elemento) => {
        const etiqueta = elemento.tagName.toLowerCase();
        const regla = keepAttributes[etiqueta] ?? keepAttributes["*"];
        if (regla === true) return;
        if (Array.isArray(regla)) {
          [...elemento.attributes].forEach((atributo) => {
            if (!regla.includes(atributo.name)) {
              elemento.removeAttribute(atributo.name);
            }
          });
          return;
        }
        [...elemento.attributes].forEach((atributo) => {
          elemento.removeAttribute(atributo.name);
        });
      });
    }
    if (removeComments) {
      const recorrido = document.createTreeWalker(raiz, NodeFilter.SHOW_COMMENT);
      const comentarios = [];
      while (recorrido.nextNode()) {
        comentarios.push(recorrido.currentNode);
      }
      comentarios.forEach((comentario) => comentario.remove());
    }
    if (compress) {
      let contieneContenido2 = function(nodo) {
        if (nodo.nodeType === Node.ELEMENT_NODE && etiquetasContenido.includes(nodo.tagName)) {
          return true;
        }
        for (const hijo of nodo.childNodes) {
          if (hijo.nodeType === Node.TEXT_NODE && hijo.textContent.trim() !== "") {
            return true;
          }
          if (hijo.nodeType === Node.ELEMENT_NODE && hijo.tagName === "BR") {
            return true;
          }
          if (hijo.nodeType === Node.ELEMENT_NODE && contieneContenido2(hijo)) {
            return true;
          }
        }
        return false;
      };
      var contieneContenido = contieneContenido2;
      let huboCambios;
      do {
        huboCambios = false;
        [...raiz.querySelectorAll("*")].reverse().forEach((elemento) => {
          if (!contieneContenido2(elemento)) {
            elemento.remove();
            huboCambios = true;
          }
        });
      } while (huboCambios);
    }
    function aplanarContenedores(contenedor, { tags = ["div"], keepRoot = true } = {}) {
      const etiquetasPermitidas = new Set(
        tags.map((etiqueta) => etiqueta.toUpperCase())
      );
      let huboCambios;
      do {
        huboCambios = false;
        [...contenedor.querySelectorAll("*")].reverse().forEach((elemento) => {
          if (keepRoot && elemento === contenedor) return;
          if (!etiquetasPermitidas.has(elemento.tagName)) return;
          if (elemento.attributes.length) return;
          if (elemento.children.length !== 1) return;
          for (const nodo of elemento.childNodes) {
            if (nodo.nodeType === Node.TEXT_NODE && nodo.textContent.trim() !== "") {
              return;
            }
          }
          const hijo = elemento.firstElementChild;
          elemento.replaceWith(hijo);
          huboCambios = true;
        });
      } while (huboCambios);
    }
    if (flatten?.enabled) {
      aplanarContenedores(raiz, flatten);
    }
    return raiz;
  }

  // src/utils/dom/removeDuplicateClasses.js
  function removeDuplicateClasses(element) {
    const raiz = element.cloneNode(true);
    const contadorClases = /* @__PURE__ */ new Map();
    const contarClases = (elemento) => {
      elemento.classList.forEach((clase) => {
        contadorClases.set(clase, (contadorClases.get(clase) || 0) + 1);
      });
    };
    contarClases(raiz);
    raiz.querySelectorAll("*").forEach(contarClases);
    const clasesEliminadas = [];
    const clasesUnicas = [];
    for (const [clase, cantidad] of contadorClases) {
      if (cantidad > 1) {
        clasesEliminadas.push(clase);
      } else {
        clasesUnicas.push(clase);
      }
    }
    const limpiarClases = (elemento) => {
      clasesEliminadas.forEach((clase) => {
        elemento.classList.remove(clase);
      });
      if (elemento.classList.length === 0) {
        elemento.removeAttribute("class");
      }
    };
    limpiarClases(raiz);
    raiz.querySelectorAll("*").forEach(limpiarClases);
    return {
      element: raiz,
      removedClasses: clasesEliminadas,
      uniqueClasses: clasesUnicas
    };
  }

  // src/utils/dom/compareClasses.js
  function compareClasses(elementA, elementB) {
    const esElementoA = elementA instanceof HTMLElement;
    const esElementoB = elementB instanceof HTMLElement;
    if (esElementoA !== esElementoB) {
      throw new TypeError(
        "compareClasses expects both arguments to be HTMLElement or both to be string[]."
      );
    }
    const obtenerClases = (elemento) => {
      const clases = /* @__PURE__ */ new Set();
      const agregarClases = (nodo) => {
        nodo.classList.forEach((clase) => clases.add(clase));
      };
      agregarClases(elemento);
      elemento.querySelectorAll("*").forEach(agregarClases);
      return clases;
    };
    const clasesA = esElementoA ? obtenerClases(elementA) : new Set(elementA);
    const clasesB = esElementoB ? obtenerClases(elementB) : new Set(elementB);
    const clasesCompartidas = [];
    const clasesUnicasA = [];
    const clasesUnicasB = [];
    for (const clase of clasesA) {
      if (clasesB.has(clase)) {
        clasesCompartidas.push(clase);
      } else {
        clasesUnicasA.push(clase);
      }
    }
    for (const clase of clasesB) {
      if (!clasesA.has(clase)) {
        clasesUnicasB.push(clase);
      }
    }
    return {
      sharedClasses: clasesCompartidas,
      uniqueClassesA: clasesUnicasA,
      uniqueClassesB: clasesUnicasB
    };
  }

  // src/utils/dom/removeElementsByClass.js
  function removeElementsByClass(element, patterns) {
    const raiz = element.cloneNode(true);
    const coincide = (clase) => {
      return patterns.some((patron) => {
        if (patron instanceof RegExp) {
          return patron.test(clase);
        }
        return clase.includes(patron);
      });
    };
    [...raiz.querySelectorAll("*")].reverse().forEach((elemento) => {
      if ([...elemento.classList].some(coincide)) {
        elemento.remove();
      }
    });
    return raiz;
  }

  // src/utils/browser-utils.js
  function cleanDocument(root) {
    root.querySelectorAll("script").forEach((e) => e.remove());
    root.querySelectorAll("style").forEach((e) => e.remove());
    root.querySelectorAll('link[rel="stylesheet"]').forEach((e) => e.remove());
    root.querySelectorAll("*").forEach((el) => {
      el.removeAttribute("style");
      for (const attr of [...el.attributes]) {
        if (attr.name.startsWith("on")) {
          el.removeAttribute(attr.name);
        }
      }
    });
  }
  function addStyle(css) {
    let head = document.head;
    if (!head) {
      head = document.createElement("head");
      document.documentElement.prepend(head);
    }
    const style = document.createElement("style");
    style.textContent = css;
    head.appendChild(style);
    return style;
  }
  window.domUtils = {
    cleanHtml,
    removeDuplicateClasses,
    compareClasses,
    removeElementsByClass,
    addStyle,
    cleanDocument
  };
})();
