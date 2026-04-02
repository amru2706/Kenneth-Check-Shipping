import https from 'https';

https.get('https://api.binderbyte.com/v1/track?api_key=test&courier=sicepat&awb=123', (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log('Body:', data));
}).on('error', (err) => {
  console.error('Error:', err.message);
});
