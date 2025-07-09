import { auth, db } from './firebase.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  ref,
  push,
  get,
  child,
  set,
  remove
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

window.login = function () {
  const email = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  signInWithEmailAndPassword(auth, email, password)
    .then(() => location.reload())
    .catch(error => alert('Erro: ' + error.message));
};

window.register = function () {
  const email = document.getElementById('registerUsername').value;
  const password = document.getElementById('registerPassword').value;
  createUserWithEmailAndPassword(auth, email, password)
    .then(() => alert('Registrado com sucesso!'))
    .catch(error => alert('Erro: ' + error.message));
};

window.logout = function () {
  signOut(auth).then(() => location.reload());
};

window.showRegister = function () {
  document.getElementById('loginSection').classList.add('hidden');
  document.getElementById('registerSection').classList.remove('hidden');
};

window.showLogin = function () {
  document.getElementById('registerSection').classList.add('hidden');
  document.getElementById('loginSection').classList.remove('hidden');
};

window.showSection = function (sectionId) {
  document.querySelectorAll('.section').forEach(sec => sec.classList.add('hidden'));
  document.getElementById(sectionId).classList.remove('hidden');
};

window.createFolder = function () {
  const folderName = document.getElementById('newFolderName').value.trim();
  if (!folderName) return alert('Digite um nome válido.');
  const userId = auth.currentUser?.uid;
  if (!userId) return alert('Usuário não autenticado.');

  set(ref(db, `users/${userId}/folders/${folderName}`), { createdAt: new Date().toISOString() })
    .then(() => {
      alert(`Pasta '${folderName}' criada!`);
      document.getElementById('newFolderName').value = '';
      updateFolderSelects();
    })
    .catch(err => alert('Erro: ' + err.message));
};

window.uploadFile = function () {
  const folder = document.getElementById('folderSelect').value;
  const fileInput = document.getElementById('fileInput');
  if (!folder || fileInput.files.length === 0) return alert('Selecione pasta e arquivo.');

  const file = fileInput.files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    const base64 = e.target.result.split(',')[1];
    const fileData = { name: file.name, type: file.type, content: base64 };
    const userId = auth.currentUser.uid;
    push(ref(db, `users/${userId}/folders/${folder}`), fileData)
      .then(() => alert('Arquivo enviado!'));
  };
  reader.readAsDataURL(file);
};

window.saveDocument = function () {
  const folder = document.getElementById('folderSelectDoc').value;
  const content = document.getElementById('docEditor').value;
  const name = document.getElementById('docName').value.trim();

  if (!folder || !content || !name) return alert('Preencha todos os campos.');

  const userId = auth.currentUser?.uid;
  if (!userId) return alert('Usuário não autenticado.');

  const fileData = {
    name: name.endsWith('.txt') ? name : name + '.txt',
    type: 'text/plain',
    content: btoa(content),
  };

  push(ref(db, `users/${userId}/folders/${folder}`), fileData)
    .then(() => {
      alert('Documento salvo!');
      document.getElementById('docEditor').value = '';
      document.getElementById('docName').value = '';
    })
    .catch(error => alert('Erro ao salvar documento: ' + error.message));
};

function updateFolderSelects() {
  const folderSelect = document.getElementById('folderSelect');
  const folderSelectDoc = document.getElementById('folderSelectDoc');
  const folderList = document.getElementById('folderList');

  folderSelect.innerHTML = '';
  if (folderSelectDoc) folderSelectDoc.innerHTML = '';
  if (folderList) folderList.innerHTML = '';

  const userId = auth.currentUser?.uid;
  if (!userId) return;

  get(child(ref(db), `users/${userId}/folders`)).then(snapshot => {
    if (snapshot.exists()) {
      const folders = snapshot.val();
      Object.keys(folders).forEach(folder => {
        // Dropdown
        const option = document.createElement('option');
        option.value = folder;
        option.textContent = folder;
        folderSelect.appendChild(option);

        const optionDoc = document.createElement('option');
        optionDoc.value = folder;
        optionDoc.textContent = folder;
        folderSelectDoc.appendChild(optionDoc);

        // Lista visual
        if (folderList) {
          const div = document.createElement('div');
          div.className = 'folder';
          div.textContent = folder;
          div.onclick = () => listFilesInFolderGerenciar(folder);

          // Botão de exclusão da pasta
          const delBtn = document.createElement('button');
          delBtn.textContent = 'Excluir Pasta';
          delBtn.style.marginLeft = '10px';
          delBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm(`Deseja excluir a pasta "${folder}" e todos os seus arquivos?`)) {
              remove(ref(db, `users/${userId}/folders/${folder}`)).then(() => {
                alert('Pasta excluída!');
                updateFolderSelects();
              });
            }
          };

          div.appendChild(delBtn);
          folderList.appendChild(div);
        }
      });
    }
  });
}

function listFilesInFolderGerenciar(folderName) {
  const folderFilesList = document.getElementById('folderFilesList');
  folderFilesList.innerHTML = '';

  const userId = auth.currentUser?.uid;
  if (!userId) return;

  get(child(ref(db), `users/${userId}/folders/${folderName}`)).then(snapshot => {
    if (snapshot.exists()) {
      const files = snapshot.val();

      Object.keys(files).forEach(fileId => {
        const file = files[fileId];
        const li = document.createElement('li');
        li.textContent = file.name;

        const viewBtn = document.createElement('button');
        viewBtn.textContent = 'Visualizar';
        viewBtn.onclick = () => {
          const blob = atob(file.content);
          const byteArray = new Uint8Array(blob.length);
          for (let i = 0; i < blob.length; i++) byteArray[i] = blob.charCodeAt(i);
          const fileBlob = new Blob([byteArray], { type: file.type });
          const url = URL.createObjectURL(fileBlob);
          window.open(url, '_blank');
        };

        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = 'Download';
        downloadBtn.onclick = () => {
          const blob = atob(file.content);
          const byteArray = new Uint8Array(blob.length);
          for (let i = 0; i < blob.length; i++) byteArray[i] = blob.charCodeAt(i);
          const fileBlob = new Blob([byteArray], { type: file.type });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(fileBlob);
          a.download = file.name;
          a.click();
        };

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Excluir';
        deleteBtn.onclick = () => {
          if (confirm('Deseja excluir este arquivo?')) {
            remove(ref(db, `users/${userId}/folders/${folderName}/${fileId}`)).then(() => {
              alert('Arquivo excluído!');
              listFilesInFolderGerenciar(folderName);
            });
          }
        };

        li.appendChild(viewBtn);
        li.appendChild(downloadBtn);
        li.appendChild(deleteBtn);
        folderFilesList.appendChild(li);
      });
    } else {
      folderFilesList.innerHTML = '<li>Nenhum arquivo nesta pasta.</li>';
    }
  });
}

onAuthStateChanged(auth, user => {
  if (user) {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('appSection').classList.remove('hidden');
    updateFolderSelects();
  }
});
