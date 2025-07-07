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
  set
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

  if (!folderName) {
    alert('Digite um nome válido para a pasta.');
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    alert('Usuário não está autenticado.');
    return;
  }

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
  const folderList = document.getElementById('folderList');
  folderSelect.innerHTML = '';
  if (folderList) folderList.innerHTML = '';

  const userId = auth.currentUser?.uid;
  if (!userId) return;

  get(child(ref(db), `users/${userId}/folders`)).then(snapshot => {
    if (snapshot.exists()) {
      const folders = snapshot.val();

      Object.keys(folders).forEach(folder => {
        // select
        const option = document.createElement('option');
        option.value = folder;
        option.textContent = folder;
        folderSelect.appendChild(option);

        // lista visual
        if (folderList) {
          const div = document.createElement('div');
          div.className = 'folder';
          div.textContent = folder;
          div.onclick = () => listFilesInFolder(folder);
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
        li.textContent = file.name;

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

        li.appendChild(viewBtn);
        fileList.appendChild(li);
      });
    } else {
      fileList.innerHTML = '<li>Nenhum arquivo nesta pasta.</li>';
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
