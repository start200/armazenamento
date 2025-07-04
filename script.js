let storage = JSON.parse(localStorage.getItem('fileManager95')) || { folders: {} };
updateFolderSelects();
renderFolders();

function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(section => {
    section.classList.add('hidden');
  });
  document.getElementById(sectionId).classList.remove('hidden');
}

function createFolder() {
  const folderName = document.getElementById('newFolderName').value.trim();
  if (folderName === '' || storage.folders[folderName]) {
    alert('Nome inválido ou pasta já existe.');
    return;
  }
  storage.folders[folderName] = [];
  saveStorage();
  updateFolderSelects();
  renderFolders();
  document.getElementById('newFolderName').value = '';
}

function updateFolderSelects() {
  const folderSelect = document.getElementById('folderSelect');
  const folderSelectDoc = document.getElementById('folderSelectDoc');
  folderSelect.innerHTML = '';
  folderSelectDoc.innerHTML = '';
  for (let folder in storage.folders) {
    folderSelect.innerHTML += `<option value="${folder}">${folder}</option>`;
    folderSelectDoc.innerHTML += `<option value="${folder}">${folder}</option>`;
  }
}

function uploadFile() {
  const folder = document.getElementById('folderSelect').value;
  const fileInput = document.getElementById('fileInput');
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
      const fileData = {
        name: file.name,
        content: e.target.result,
        type: file.type
      };
      storage.folders[folder].push(fileData);
      saveStorage();
      alert('Arquivo "' + file.name + '" enviado para "' + folder + '"');
      fileInput.value = '';
      renderFolders(); // Atualiza a lista após upload
    };

    reader.readAsDataURL(file);
  } else {
    alert('Selecione um arquivo para enviar.');
  }
}

function saveDocument() {
  const folder = document.getElementById('folderSelectDoc').value;
  const content = document.getElementById('docEditor').value.trim();
  if (content === '') {
    alert('O documento está vazio.');
    return;
  }
  const docName = 'Documento_' + (storage.folders[folder].length + 1) + '.txt';
  const fileData = {
    name: docName,
    content: 'data:text/plain;base64,' + btoa(content),
    type: 'text/plain'
  };
  storage.folders[folder].push(fileData);
  saveStorage();
  document.getElementById('docEditor').value = '';
  alert('Documento "' + docName + '" salvo em "' + folder + '"');
  renderFolders();
}

function renderFolders() {
  const folderList = document.getElementById('folderList');
  folderList.innerHTML = '';
  for (let folder in storage.folders) {
    const div = document.createElement('div');
    div.className = 'folder';
    div.textContent = folder;

    div.onclick = () => openFolder(folder);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Excluir';
    deleteBtn.style.marginLeft = '10px';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      if (confirm('Tem certeza que deseja excluir a pasta "' + folder + '"?')) {
        delete storage.folders[folder];
        saveStorage();
        updateFolderSelects();
        renderFolders();
      }
    };

    div.appendChild(deleteBtn);
    folderList.appendChild(div);
  }
}

function openFolder(folder) {
  const files = storage.folders[folder];
  if (files.length === 0) {
    alert('A pasta está vazia.');
    return;
  }

  let fileList = '';
  files.forEach((file, index) => {
    fileList += `
      <div style="margin-bottom: 10px;">
        ${file.name} 
        <a href="${file.content}" download="${file.name}">[Baixar]</a> 
        <button onclick="viewFile('${folder}', ${index})">Visualizar</button>
        <button onclick="deleteFile('${folder}', ${index})">Excluir</button>
      </div>
    `;
  });

  // Cria uma nova janela para listar arquivos
  const newWindow = window.open('', '_blank', 'width=600,height=600,scrollbars=yes');
  newWindow.document.write(`
    <html>
      <head><title>Arquivos em ${folder}</title></head>
      <body>
        <h2>Arquivos em "${folder}"</h2>
        <div id="fileListContainer">${fileList}</div>
        <script>
          const storage = JSON.parse(localStorage.getItem('fileManager95')) || { folders: {} };

          function viewFile(folder, index) {
            const file = storage.folders[folder][index];
            const fileWindow = window.open('', '_blank', 'width=600,height=600,scrollbars=yes');
            fileWindow.document.write(\`
              <html><head><title>\${file.name}</title></head><body>
              <h3>\${file.name}</h3>
              <iframe src="\${file.content}" style="width:100%;height:90vh;"></iframe>
              </body></html>
            \`);
          }

          function deleteFile(folder, index) {
            if (confirm('Deseja excluir este arquivo?')) {
              storage.folders[folder].splice(index, 1);
              localStorage.setItem('fileManager95', JSON.stringify(storage));
              alert('Arquivo excluído!');
              location.reload();
            }
          }
        <\/script>
      </body>
    </html>
  `);
  newWindow.document.close();
}

function viewFile(folder, index) {
  // Função para abrir viewer.html (pode ser implementada para edição, visualização)
  // Por ora está abrindo na nova janela pelo openFolder
}

function deleteFile(folder, index) {
  if (confirm('Deseja excluir este arquivo?')) {
    storage.folders[folder].splice(index, 1);
    saveStorage();
    alert('Arquivo excluído!');
    renderFolders();
  }
}

function saveStorage() {
  localStorage.setItem('fileManager95', JSON.stringify(storage));
}
