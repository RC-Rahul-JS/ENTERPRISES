import axios from 'axios';

const UploadFile = async (file) => {
  if (!file) return 'xx';
  if (typeof file === 'string') return file;

  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await axios.post(
      'https://api.care2connect.in/duniyape/aws/upload',
      formData
    );
    return response.data?.url || response.data?.location || 'xx';
  } catch (error) {
    console.error('File upload failed:', error);
    return 'xx';
  }
};

export default UploadFile;
