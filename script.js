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

window.login = function login() {
  const email = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => location.reload())
    .catch(error => alert('Erro: ' + error.message));
};

window.register = function register() {
  const email = document.getElementById('registerUsername').value;
  const password = document.getElementById('registerPassword').value;

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => alert('Registrado com sucesso!'))
    .catch(error => alert('Erro: ' + error.message));
};

window.logout = function logout() {
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
  if (!folderName) return alert('Nome inválido.');
  const userId = auth.currentUser.uid;
  set(ref(db, `users/${userId}/folders/${folderName}`), []);
  updateFolderSelects();
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
    push(ref(db, `users/${userId}/folders/${folder}`), fileData);
  };
  reader.readAsDataURL(file);
};

function updateFolderSelects() {
  const folderSelect = document.getElementById('folderSelect');
  folderSelect.innerHTML = '';
  const userId = auth.currentUser?.uid;
  if (!userId) return;
  get(child(ref(db), `users/${userId}/folders`)).then(snapshot => {
    if (snapshot.exists()) {
      Object.keys(snapshot.val()).forEach(folder => {
        const option = document.createElement('option');
        option.value = folder;
        option.textContent = folder;
        folderSelect.appendChild(option);
      });
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


