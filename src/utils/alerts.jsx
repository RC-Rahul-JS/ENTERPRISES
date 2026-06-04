// src/utils/alerts.js
import Swal from 'sweetalert2';

export const showSuccessAlert = (title, text) => {
  Swal.fire({
    icon: 'success',
    title,
    text,
    timer: 2000,
    timerProgressBar: true,
    showConfirmButton: false,
  });
};

export const showErrorAlert = (title, text) => {
  Swal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonColor: '#d33',
  });
};