import axios from 'axios';

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:3001/auth/login', {
      email: 'admin@oricruit.com',
      password: 'password123'
    });
    console.log('Login Success:', response.data.token ? 'YES' : 'NO');
  } catch (error: any) {
    console.log('Login Failed:', error.response?.status, error.response?.data);
  }
}

testLogin();
