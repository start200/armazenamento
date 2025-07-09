
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
  if (!folderName) return alert('Digite um nome válido para a pasta.');
  const user = auth.currentUser;
  if (!user) return alert('Usuário não está autenticado.');
  const userId = user.uid;
  const folderRef = ref(db, `users/${userId}/folders/${folderName}`);
  set(folderRef, { createdAt: new Date().toISOString() })
    .then(() => {
      alert(`Pasta '${folderName}' criada com sucesso!`);
      document.getElementById('newFolderName').value = '';
      updateFolderSelects();
    })
    .catch(error => {
      console.error("Erro ao criar pasta:", error);
      alert("Erro ao criar pasta: " + error.message);
    });
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

function updateFolderSelects() {
  const folderSelect = document.getElementById('folderSelect');
  const folderSelectDoc = document.getElementById('folderSelectDoc');
  const folderList = document.getElementById('folderList');

  if (folderSelect) folderSelect.innerHTML = '';
  if (folderSelectDoc) folderSelectDoc.innerHTML = '';
  if (folderList) folderList.innerHTML = '';

  const userId = auth.currentUser?.uid;
  if (!userId) return;

  get(child(ref(db), `users/${userId}/folders`)).then(snapshot => {
    if (snapshot.exists()) {
      const folders = snapshot.val();

      Object.keys(folders).forEach(folder => {
        const option1 = document.createElement('option');
        option1.value = folder;
        option1.textContent = folder;
        if (folderSelect) folderSelect.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = folder;
        option2.textContent = folder;
        if (folderSelectDoc) folderSelectDoc.appendChild(option2);

        // Visual list
        if (folderList) {
          const div = document.createElement('div');
          div.className = 'folder';
          div.textContent = folder;
          div.onclick = () => listFilesInFolderGerenciar(folder);
          folderList.appendChild(div);
        }
      });

      const firstFolder = Object.keys(folders)[0];
      listFilesInFolder(firstFolder);
    }
  });
}


function listFilesInFolder(folderName) {
  const fileList = document.getElementById('fileList');
  if (!fileList) return;
  fileList.innerHTML = '';
  const userId = auth.currentUser?.uid;
  if (!userId) return;
  get(child(ref(db), `users/${userId}/folders/${folderName}`)).then(snapshot => {
    if (snapshot.exists()) {
      const files = snapshot.val();
      Object.keys(files).forEach(fileId => {
        const file = files[fileId];
        const li = document.createElement('li');
        li.textContent = file.name + ' ';
        const viewBtn = document.createElement('button');
        viewBtn.textContent = '👁';
        viewBtn.onclick = () => {
          const blob = atob(file.content);
          const byteArray = new Uint8Array(blob.length);
          for (let i = 0; i < blob.length; i++) byteArray[i] = blob.charCodeAt(i);
          const fileBlob = new Blob([byteArray], { type: file.type });
          const url = URL.createObjectURL(fileBlob);
          window.open(url, '_blank');
        };
        const editBtn = document.createElement('button');
        editBtn.textContent = '✏️';
        editBtn.onclick = () => {
          const decoded = atob(file.content);
          const newContent = prompt("Editar conteúdo:", decoded);
          if (newContent !== null) {
            const updatedData = { ...file, content: btoa(newContent) };
            set(ref(db, `users/${userId}/folders/${folderName}/${fileId}`), updatedData)
              .then(() => listFilesInFolder(folderName));
          }
        };
        const delBtn = document.createElement('button');
        delBtn.textContent = '🗑';
        delBtn.onclick = () => {
          if (confirm(`Tem certeza que deseja excluir ${file.name}?`)) {
            remove(ref(db, `users/${userId}/folders/${folderName}/${fileId}`))
              .then(() => listFilesInFolder(folderName));
          }
        };
        li.appendChild(viewBtn);
        li.appendChild(editBtn);
        li.appendChild(delBtn);
        fileList.appendChild(li);
      });
    } else {
      fileList.innerHTML = '<li>Nenhum arquivo nesta pasta.</li>';
    }
  });
}

window.saveNewDocument = function () {
  const folder = document.getElementById('notepadFolderSelect').value;
  const filename = prompt("Nome do novo arquivo:");
  const content = document.getElementById('notepadArea').value;
  if (!folder || !filename || !content) return alert("Preencha todos os campos.");
  const fileData = { name: filename, type: 'text/plain', content: btoa(content) };
  const userId = auth.currentUser?.uid;
  push(ref(db, `users/${userId}/folders/${folder}`), fileData)
    .then(() => alert('Documento salvo!'));
};

onAuthStateChanged(auth, user => {
  if (user) {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('appSection').classList.remove('hidden');
    updateFolderSelects();
  }
});

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

        // Botão visualizar
        const viewBtn = document.createElement('button');
        viewBtn.textContent = 'Visualizar';
        viewBtn.onclick = () => {
          const blob = atob(file.content);
          const byteArray = new Uint8Array(blob.length);
          for (let i = 0; i < blob.length; i++) {
            byteArray[i] = blob.charCodeAt(i);
          }
          const fileBlob = new Blob([byteArray], { type: file.type });
          const url = URL.createObjectURL(fileBlob);
          window.open(url, '_blank');
        };

        // Botão excluir
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Excluir';
        deleteBtn.onclick = () => {
          if (confirm('Deseja excluir este arquivo?')) {
            const fileRef = ref(db, `users/${userId}/folders/${folderName}/${fileId}`);
            set(fileRef, null).then(() => {
              alert('Arquivo excluído!');
              listFilesInFolderGerenciar(folderName);
            });
          }
        };

        li.appendChild(viewBtn);
        li.appendChild(deleteBtn);
        folderFilesList.appendChild(li);
      });
    } else {
      folderFilesList.innerHTML = '<li>Nenhum arquivo nesta pasta.</li>';
    }
  });
}

