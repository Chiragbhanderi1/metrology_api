const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const serviceAccount = require('./key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://metrology-f7717-default-rtdb.asia-southeast1.firebasedatabase.app/'
});
const app = express();
const db = admin.firestore();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Add a new product to the Firebase database
app.post('/products', async (req, res) => {
  try {
    const category = req.body.category;
    const categoryimg = req.body.cimg;
    const subcategory = req.body.subcategory;
    const subcategoryimg = req.body.scimg;
    const subsubcategory = req.body.subsubcategory;
    const subsubcategoryimg = req.body.sscimg;
    const title=req.body.title;
    const size=req.body.size;
    // Add a new category at level 1
    const level1Ref = await db.collection(category).add({  categoryimg });
    const level1Id = level1Ref.id;

    // Add a new category at level 2
    const level2Ref = await level1Ref.collection(subcategory).add({  subcategoryimg });
    const level2Id = level2Ref.id;

    // Add a new category at level 3
    const level3Ref = await level2Ref.collection(subsubcategory).add({  subsubcategoryimg,title,size });
    const level3Id = level3Ref.id;

    res.status(201).json({ level1Id, level2Id, level3Id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add product' });
  }
});
app.get('/categories', async (req, res) => {
  try {
    const categoriesRef = db.collection('categories');
    const snapshot = await categoriesRef.get();
    const categories = [];
    for (const doc of snapshot.docs) {
      const level1Data = doc.data();
      const level1Id = doc.id;
      const category = {
        id: level1Id,
        image: level1Data.image,
        subcategories: []
      };
      const subcategoriesRef = doc.ref.collection('subcategories');
      const subSnapshot = await subcategoriesRef.get();
      for (const subDoc of subSnapshot.docs) {
        const level2Data = subDoc.data();
        const level2Id = subDoc.id;
        const subcategory = {
          id: level2Id,
          image: level2Data.image,
          subcategories: []
        };
        const sub2categoriesRef = subDoc.ref.collection('subcategories');
        const sub2Snapshot = await sub2categoriesRef.get();
        for (const sub2Doc of sub2Snapshot.docs) {
          const level3Data = sub2Doc.data();
          const level3Id = sub2Doc.id;
          const sub2category = {
            id: level3Id,
            name: level3Data.name,
            products: level3Data.products,
          };
          subcategory.subcategories.push(sub2category);
        }
        category.subcategories.push(subcategory);
      }

      categories.push(category);
    }

    res.status(200).json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});
app.get('/getproduct/:categoryId/:subcategoryId/:productId', async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const subcategoryId = req.params.subcategoryId;
    const productId = req.params.productId;

    const categoryRef = db.collection('categories').doc(categoryId);
    const categoryDoc = await categoryRef.get();

    if (!categoryDoc.exists) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const subcategoryRef = categoryRef.collection('subcategories').doc(subcategoryId);
    const subcategoryDoc = await subcategoryRef.get();

    if (!subcategoryDoc.exists) {
      res.status(404).json({ error: 'Subcategory not found' });
      return;
    }

    const productRef = subcategoryRef.collection('subcategories').doc(productId);
    const productDoc = await productRef.get();
    if (!productDoc.exists) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    const productData = productDoc.data();
    const product = {
      id: productId,
      name: productData.name,
      product:productData.products
    };

    res.status(200).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});
app.get('/products/:categoryId/:subcategoryId', async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const subcategoryId = req.params.subcategoryId;

    const categoryRef = db.collection('categories').doc(categoryId);
    const categoryDoc = await categoryRef.get();

    if (!categoryDoc.exists) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const subcategoryRef = categoryRef.collection('subcategories').doc(subcategoryId);
    const subcategoryDoc = await subcategoryRef.get();

    if (!subcategoryDoc.exists) {
      res.status(404).json({ error: 'Subcategory not found' });
      return;
    }

    const productsRef = subcategoryRef.collection('products');
    const productsQuerySnapshot = await productsRef.get();

    const products = [];
    productsQuerySnapshot.forEach((doc) => {
      const productData = doc.data();
      const product = {
        id: doc.id,
        name: productData.name,
        image: productData.image,
        price: productData.price,
        description: productData.description
      };
      products.push(product);
    });

    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});


const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
    