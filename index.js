const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const serviceAccount = require('./key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://metrology-f7717-default-rtdb.asia-southeast1.firebasedatabase.app/'
});
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Add a new product to the Firebase database
app.post('/products', async (req, res) => {
    try {
      const newproduct = await admin.firestore().collection('products').add(req.body);
      res.status(200).json({ id: newproduct.id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to add product' });
    }
  });
  // Get all products from the Firebase database
app.get('/getproducts', async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection('products').get();
    const products = [];
    snapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() });
    });
    res.status(200).json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get products' });
  }
});
app.get('/getproducts/:category/:subcategory/:subsubcategory', async (req, res) => {
  try {
    const category = req.params.category;
    const subcategory = req.params.subcategory;
    const subsubcategory = req.params.subsubcategory;
    const snapshot = await admin.firestore().collection('products').get();
    const products = [];
    snapshot.forEach(doc => {
      if (doc.data().category===category && doc.data().subcategory===subcategory && doc.data().subsubcategory===subsubcategory) {        
        products.push({ id: doc.id, ...doc.data() });
      }
    });
    res.status(200).json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

// Get a single product from the Firebase database
app.get('/getproduct/:id', async (req, res) => {
  try {
    const productRef = admin.firestore().collection('products').doc(req.params.id);
    const product = await productRef.get();
    if (!product.exists) {
      res.status(404).json({ error: 'product not found' });
    } else {
      res.status(200).json({ id: product.id, ...product.data() });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get product' });
  }
});

  
  // Update an product in the Firebase database
  app.put('/updateproduct/:id', async (req, res) => {
    try {
      const productRef = admin.firestore().collection('products').doc(req.params.id);
      await productRef.update(req.body);
      res.status(200).end();
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update product' });
    }
  });
  
  // Delete an product from the Firebase database
  app.delete('/deleteproduct/:id', async (req, res) => {
    try {
      const productRef = admin.firestore().collection('products').doc(req.params.id);
      await productRef.delete();
      res.status(200).end();
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  });
  const port = process.env.PORT || 3000;

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
    