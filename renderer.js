document.addEventListener("DOMContentLoaded", () => {
  const workspace = document.getElementById("workspace");
  const addCircleBtn = document.getElementById("addCircle");
  const circleList = document.getElementById("circleList");
  const relationsDiv = document.getElementById("relations");
  const calculateBtn = document.getElementById("calculate");
  const resultDiv = document.getElementById("result");

  let circles = [];
  let relations = [];
  let selectedCircle = null;
  let nextCircleId = 1;
  let connectionCanvas, connectionCtx;

  // Типы связей
  const RELATION_TYPES = {
    AND: "and",
    OR: "or",
  };

  // Инициализация canvas для рисования связей
  function initConnectionCanvas() {
    connectionCanvas = document.createElement("canvas");
    connectionCanvas.id = "connectionCanvas";
    connectionCanvas.style.position = "absolute";
    connectionCanvas.style.top = "0";
    connectionCanvas.style.left = "0";
    connectionCanvas.style.pointerEvents = "none";
    connectionCanvas.width = workspace.clientWidth;
    connectionCanvas.height = workspace.clientHeight;
    workspace.appendChild(connectionCanvas);
    connectionCtx = connectionCanvas.getContext("2d"); // Исправлено: getContext вместо getBoundingClientRect
}
  // Рисование связей с указанием типа
  function drawConnections() {
    if (!connectionCtx) return;

    connectionCtx.clearRect(0, 0, connectionCanvas.width, connectionCanvas.height);

    relations.forEach((relation) => {
        const fromCircle = circles.find((c) => c.id === relation.from);
        const toCircle = circles.find((c) => c.id === relation.to);

        if (fromCircle && toCircle) {
            const fromElement = document.getElementById(fromCircle.id);
            const toElement = document.getElementById(toCircle.id);

            if (fromElement && toElement) {
                const fromRect = fromElement.getBoundingClientRect();
                const toRect = toElement.getBoundingClientRect();
                const workspaceRect = workspace.getBoundingClientRect();

                const fromX = fromRect.left + fromRect.width / 2 - workspaceRect.left;
                const fromY = fromRect.top + fromRect.height / 2 - workspaceRect.top;
                const toX = toRect.left + toRect.width / 2 - workspaceRect.left;
                const toY = toRect.top + toRect.height / 2 - workspaceRect.top;

                // Устанавливаем цвет связи
                let strokeColor;
                if (relation.color) {
                    strokeColor = relation.color; // Используем заданный цвет
                } else {
                    strokeColor = relation.type === RELATION_TYPES.OR ? "#4ECDC4" : "#4ECDC4";
                }

                // Рисуем линию
                connectionCtx.beginPath();
                connectionCtx.moveTo(fromX, fromY);
                connectionCtx.lineTo(toX, toY);
                connectionCtx.strokeStyle = strokeColor;
                connectionCtx.lineWidth = 2;
                connectionCtx.stroke();

                // Рисуем стрелку
                drawArrow(connectionCtx, fromX, fromY, toX, toY);

                // Подпись типа связи
                const midX = (fromX + toX) / 2;
                const midY = (fromY + toY) / 2;
                connectionCtx.fillStyle = "#000";
                connectionCtx.font = "12px Arial";
                connectionCtx.fillText(
                    relation.type.toUpperCase(),
                    midX - 10,
                    midY - 5
                );
            }
        }
    });
}

  // Функция для рисования стрелки
  function drawArrow(ctx, fromX, fromY, toX, toY) {
    const headLength = 10;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle - Math.PI / 6),
      toY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle + Math.PI / 6),
      toY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  }

  // Добавление нового узла (круга)
  addCircleBtn.addEventListener("click", () => {
    const circleId = `circle-${nextCircleId++}`;
    const circle = {
      id: circleId,
      x: 100 + Math.random() * 300,
      y: 100 + Math.random() * 300,
      radius: 40,
      color: getRandomColor(),
      name: `${nextCircleId - 1}`,
      probability1: 0.95, // Первая вероятность
      probability2: 0.90, // Вторая вероятность
      probability3: 0.85, // Третья вероятность
    };

    circles.push(circle);
    updateCircleList();
    renderCircle(circle);
    drawConnections();
  });

  // Отрисовка узла
  function renderCircle(circle) {
    const circleElement = document.createElement("div");
    circleElement.className = "circle";
    circleElement.id = circle.id;
    circleElement.style.width = `${circle.radius * 2}px`;
    circleElement.style.height = `${circle.radius * 2}px`;
    circleElement.style.left = `${circle.x}px`;
    circleElement.style.top = `${circle.y}px`;
    circleElement.style.backgroundColor = circle.color;

    const circleText = document.createElement("div");
    circleText.className = "circle-text";
    circleText.textContent = `${circle.name}`;
    circleElement.appendChild(circleText);

    circleElement.addEventListener("click", (e) => {
      if (e.target === circleElement || e.target === circleText) {
        e.stopPropagation();
        selectCircle(circle);
      }
    });

    makeDraggable(circleElement, circle);
    workspace.appendChild(circleElement);
  }

  function makeDraggable(element, circleData) {
    let isDragging = false;
    let offsetX, offsetY;

    element.addEventListener("mousedown", (e) => {
      if (e.target === element || e.target.className.includes("circle-text")) {
        isDragging = true;
        offsetX = e.clientX - element.getBoundingClientRect().left;
        offsetY = e.clientY - element.getBoundingClientRect().top;
        element.style.cursor = "grabbing";
        selectCircle(circleData);
        e.preventDefault();
      }
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;

      const workspaceRect = workspace.getBoundingClientRect();
      let x = e.clientX - offsetX - workspaceRect.left;
      let y = e.clientY - offsetY - workspaceRect.top;

      x = Math.max(0, Math.min(x, workspaceRect.width - circleData.radius * 2));
      y = Math.max(
        0,
        Math.min(y, workspaceRect.height - circleData.radius * 2)
      );

      element.style.left = `${x}px`;
      element.style.top = `${y}px`;

      circleData.x = x;
      circleData.y = y;

      drawConnections();
    });

    document.addEventListener("mouseup", () => {
      if (isDragging) {
        isDragging = false;
        element.style.cursor = "grab";
      }
    });

    element.style.cursor = "grab";
  }

  function selectCircle(circle) {
    document.querySelectorAll(".circle").forEach((el) => {
      el.style.border = "none";
    });

    const circleElement = document.getElementById(circle.id);
    if (circleElement) {
      circleElement.style.border = "3px solid black";
    }

    selectedCircle = circle;

    if (
      window.previouslySelectedCircle &&
      window.previouslySelectedCircle.id !== circle.id
    ) {
      const relation = {
        from: window.previouslySelectedCircle.id,
        to: circle.id,
        type: RELATION_TYPES.AND, // По умолчанию связь "И"
      };

      if (!relationExists(relation.from, relation.to)) {
        relations.push(relation);
        updateRelationsList();
        drawConnections();
      }
    }

    window.previouslySelectedCircle = circle;
  }

  function relationExists(from, to) {
    return relations.some(
      (rel) =>
        (rel.from === from && rel.to === to) ||
        (rel.from === to && rel.to === from)
    );
  }

  function updateCircleList() {
    const table = document.createElement("table");
    table.innerHTML = `
            <tr>
                <th>ID</th>
                <th>Название</th>
                <th>1. Вероятность помехоустойчивого состояния</th>
                <th>2. Вероятность выживания</th>
                <th>3. Вероятность технически исправного состояния</th>
                <th>Действия</th>
            </tr>
        `;

    circles.forEach((circle, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${circle.id.replace("circle-", "")}</td>
                <td><input type="text" value="${
                  circle.name
                }" data-index="${index}" data-prop="name"></td>
                <td><input type="number" min="0" max="1" step="0.01" value="${
                  circle.probability1
                }" data-index="${index}" data-prop="probability1"></td>
                <td><input type="number" min="0" max="1" step="0.01" value="${
                  circle.probability2
                }" data-index="${index}" data-prop="probability2"></td>
                <td><input type="number" min="0" max="1" step="0.01" value="${
                  circle.probability3
                }" data-index="${index}" data-prop="probability3"></td>
                <td><button class="delete-circle" data-index="${index}">Удалить</button></td>
            `;
      table.appendChild(row);
    });

    circleList.innerHTML = "";
    circleList.appendChild(table);

    // Обработчики для редактирования свойств
    document.querySelectorAll('input[type="text"]').forEach((input) => {
      input.addEventListener("change", (e) => {
        const index = parseInt(e.target.dataset.index);
        const prop = e.target.dataset.prop;
        circles[index][prop] = e.target.value;
        updateCircleVisual(circles[index]);
      });
    });

    document.querySelectorAll('input[type="number"]').forEach((input) => {
      input.addEventListener("change", (e) => {
        const index = parseInt(e.target.dataset.index);
        const prop = e.target.dataset.prop;
        circles[index][prop] = parseFloat(e.target.value);
        updateCircleVisual(circles[index]);
      });
    });

    // Обработчики для удаления узлов
    document.querySelectorAll(".delete-circle").forEach((button) => {
      button.addEventListener("click", (e) => {
        const index = parseInt(e.target.dataset.index);
        const circleId = circles[index].id;

        relations = relations.filter(
          (rel) => rel.from !== circleId && rel.to !== circleId
        );

        circles.splice(index, 1);
        document.getElementById(circleId)?.remove();

        updateCircleList();
        updateRelationsList();
        drawConnections();
      });
    });
  }

  function updateCircleVisual(circle) {
    const circleElement = document.getElementById(circle.id);
    if (circleElement) {
      const textElement = circleElement.querySelector(".circle-text");
      if (textElement) {
        textElement.textContent = `${circle.name}`;
      }
    }
  }

  function updateRelationsList() {
    relationsDiv.innerHTML = "<h3>Связи:</h3>";

    if (relations.length === 0) {
        relationsDiv.innerHTML += "<p>Нет связей</p>";
        return;
    }

    const table = document.createElement("table");
    table.innerHTML = `
        <tr>
            <th>От</th>
            <th>К</th>
            <th>Тип</th>
            <th>Цвет</th>
            <th>Действия</th>
        </tr>
    `;

    relations.forEach((relation, index) => {
        const fromCircle = circles.find((c) => c.id === relation.from);
        const toCircle = circles.find((c) => c.id === relation.to);

        const row = document.createElement("tr");
        // все таки если надо или вставить второй опцией
        // <option value="${RELATION_TYPES.OR}" ${
        //               relation.type === RELATION_TYPES.OR ? "selected" : ""
        //             }>ИЛИ (OR)</option>
        row.innerHTML = `
            <td>${fromCircle?.name || relation.from}</td>
            <td>${toCircle?.name || relation.to}</td>
            <td>
                <select data-index="${index}" data-prop="type">
                    <option value="${RELATION_TYPES.AND}" ${
                      relation.type === RELATION_TYPES.AND ? "selected" : ""
                    }>И (AND)</option>
                    
                </select>
            </td>
            <td>
                <button class="color-relation" data-index="${index}" 
                        style="background-color: ${relation.color || '#4ECDC4'}; 
                               width: 20px; height: 20px; border: 1px solid #000;">
                </button>
            </td>
            <td>
                <button class="delete-relation" data-index="${index}">×</button>
            </td>
        `;
        table.appendChild(row);
    });

    relationsDiv.appendChild(table);

    // Обработчик изменения типа связи
    document.querySelectorAll('select[data-prop="type"]').forEach((select) => {
        select.addEventListener("change", (e) => {
            const index = parseInt(e.target.dataset.index);
            relations[index].type = e.target.value;
            drawConnections();
        });
    });

    // Обработчик изменения цвета связи
    document.querySelectorAll(".color-relation").forEach((button) => {
        button.addEventListener("click", (e) => {
            const index = parseInt(e.target.dataset.index);
            // Переключаем цвет между красным и цветом по умолчанию
            if (relations[index].color === '#FF0000') {
                relations[index].color = null; // Сброс к цвету по умолчанию
            } else {
                relations[index].color = '#FF0000'; // Красный цвет
            }
            drawConnections();
            updateRelationsList(); // Обновляем список, чтобы кнопка отобразила новый цвет
        });
    });

    // Обработчик удаления связи
    document.querySelectorAll(".delete-relation").forEach((button) => {
        button.addEventListener("click", (e) => {
            const index = parseInt(e.target.dataset.index);
            relations.splice(index, 1);
            updateRelationsList();
            drawConnections();
        });
    });
}


  // Расчет надежности системы
  calculateBtn.addEventListener("click", () => {
    if (circles.length === 0) {
      resultDiv.textContent = "Добавьте узлы для расчета";
      return;
    }

    try {
      // Находим корневые узлы (без входящих связей)
      const rootNodes = circles.filter(
        (circle) => !relations.some((rel) => rel.to === circle.id)
      );

      if (rootNodes.length === 0) {
        resultDiv.textContent =
          "Не найден корневой узел (узел без входящих связей)";
        return;
      }

      let totalReliability = 1.0;

      // Если несколько корневых узлов - считаем их как параллельные (ИЛИ)
      if (rootNodes.length > 1) {
        const reliabilities = rootNodes.map((node) =>
          calculateNodeReliability(node.id)
        );
        totalReliability =
          1 - reliabilities.reduce((acc, p) => acc * (1 - p), 1);
      } else {
        totalReliability = calculateNodeReliability(rootNodes[0].id);
      }

      resultDiv.innerHTML = `
                <strong>Вероятность безотказной работы системы:</strong><br>
                ${(totalReliability).toFixed(2)}<br>
                <small>${getSystemFormula(rootNodes.map((n) => n.id))}</small>
            `;
    } catch (e) {
      resultDiv.textContent = `Ошибка расчета: ${e.message}`;
      console.error(e);
    }
  });

  // Рекурсивный расчет надежности узла с учетом трех вероятностей
  function calculateNodeReliability(nodeId, visitedNodes = []) {
    const node = circles.find((c) => c.id === nodeId);
    if (!node) throw new Error(`Узел ${nodeId} не найден`);

    // Защита от циклов
    if (visitedNodes.includes(nodeId)) {
      throw new Error(
        `Обнаружен цикл: ${visitedNodes.join(" → ")} → ${nodeId}`
      );
    }

    const newVisited = [...visitedNodes, nodeId];
    const outgoingRelations = relations.filter((rel) => rel.from === nodeId);

    if (outgoingRelations.length === 0) {
      // Для конечного узла возвращаем произведение трех вероятностей
      return node.probability1 * node.probability2 * node.probability3;
    }

    let reliability = 1.0;
    const andGroups = [];
    const orGroups = [];
    let currentGroup = [];
    let currentType = null;

    outgoingRelations.forEach((rel) => {
      if (rel.type !== currentType) {
        if (currentGroup.length > 0) {
          currentType === RELATION_TYPES.AND
            ? andGroups.push([...currentGroup])
            : orGroups.push([...currentGroup]);
        }
        currentGroup = [rel];
        currentType = rel.type;
      } else {
        currentGroup.push(rel);
      }
    });

    if (currentGroup.length > 0) {
      currentType === RELATION_TYPES.AND
        ? andGroups.push([...currentGroup])
        : orGroups.push([...currentGroup]);
    }

    // Обработка групп
    andGroups.forEach((group) => {
      const groupReliability = group.reduce((acc, rel) => {
        return acc * calculateNodeReliability(rel.to, newVisited);
      }, 1.0);
      reliability *= groupReliability;
    });

    orGroups.forEach((group) => {
      const groupReliability =
        1 -
        group.reduce((acc, rel) => {
          return acc * (1 - calculateNodeReliability(rel.to, newVisited));
        }, 1.0);
      reliability *= groupReliability;
    });

    // Умножаем на произведение трех вероятностей текущего узла
    return node.probability1 * node.probability2 * node.probability3 * reliability;
  }

  // Генерация формулы системы (для наглядности)
  function getSystemFormula(rootNodeIds) {
    if (rootNodeIds.length === 1) {
      return getNodeFormula(rootNodeIds[0]);
    }

    const formulas = rootNodeIds.map((id) => getNodeFormula(id));
    return formulas.join(" ∨ ");
  }

  function getNodeFormula(nodeId) {
    const node = circles.find((c) => c.id === nodeId);
    const outgoingRelations = relations.filter((rel) => rel.from === nodeId);

    if (outgoingRelations.length === 0) {
      return `${node.name}`;
    }

    const parts = [];
    let currentParts = [];
    let currentType = null;

    outgoingRelations.forEach((rel) => {
      if (rel.type !== currentType) {
        if (currentParts.length > 0) {
          parts.push({
            type: currentType,
            elements: [...currentParts],
          });
        }
        currentParts = [getNodeFormula(rel.to)];
        currentType = rel.type;
      } else {
        currentParts.push(getNodeFormula(rel.to));
      }
    });

    if (currentParts.length > 0) {
      parts.push({
        type: currentType,
        elements: [...currentParts],
      });
    }

    let formula = "";
    parts.forEach((part) => {
      if (part.type === RELATION_TYPES.AND) {
        formula += part.elements.join(" ∧ ");
      } else {
        formula += `(${part.elements.join(" ∨ ")})`;
      }
    });

    return `${node.name} → ${formula}`;
  }

  function getRandomColor() {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  workspace.addEventListener("click", () => {
    selectedCircle = null;
    window.previouslySelectedCircle = null;
    document.querySelectorAll(".circle").forEach((el) => {
      el.style.border = "none";
    });
  });

  // Инициализация
  initConnectionCanvas();

  window.addEventListener("resize", () => {
    if (connectionCanvas) {
      connectionCanvas.width = workspace.clientWidth;
      connectionCanvas.height = workspace.clientHeight;
      drawConnections();
    }
  });
});