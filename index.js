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
    const productImg = req.body.productImg;
    // Add a new category at level 1
    const level1Ref = await db.collection(category).add({  categoryimg:categoryimg,name:category });
    const level1Id = level1Ref.id;

    // Add a new category at level 2
    const level2Ref = await level1Ref.collection(subcategory).add({  subcategoryimg:subcategoryimg,name:subcategory });
    const level2Id = level2Ref.id;

    // Add a new category at level 3
    const level3Ref = await level2Ref.collection(subsubcategory).add({  subsubcategoryimg:subsubcategoryimg,title:title,size:size,name:subsubcategory,productImg:productImg });
    const level3Id = level3Ref.id;

    res.status(201).json({ level1Id, level2Id, level3Id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add product' });
  }
});
app.post('/subcatproducts', async (req, res) => {
  try {
    let categoryId =" ";
    const category = req.body.category;
    const subcategory = req.body.subcategory;
    const subcategoryimg = req.body.scimg;
    const subsubcategory = req.body.subsubcategory;
    const subsubcategoryimg = req.body.sscimg;
    const title=req.body.title;
    const size=req.body.size;
    const productImg = req.body.productImg;
    // Add a new category at level 1
    const level1Ref =  db.collection(category);
    const level1Id = await level1Ref.get();
    level1Id.forEach(doc=>{
      categoryId = doc.id
    })
    // Add a new category at level 2
    const level2Ref = await level1Ref.doc(categoryId).collection(subcategory).add({  subcategoryimg:subcategoryimg,name:subcategory });
    const level2Id = level2Ref.id;
    // Add a new category at level 3
    const level3Ref = await level2Ref.collection(subsubcategory).add({  subsubcategoryimg:subsubcategoryimg,title:title,size:size,name:subsubcategory,productImg:productImg });
    const level3Id = level3Ref.id;

    res.status(201).json({ level1Id, level2Id, level3Id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add product' });
  }
});
app.post('/subsubcatproducts', async (req, res) => {
  try {
    let categoryId =" ";
    let subcategoryId =" ";
    const category = req.body.category;
    const subcategory = req.body.subcategory;
    const subsubcategory = req.body.subsubcategory;
    const subsubcategoryimg = req.body.sscimg;
    const title=req.body.title;
    const size=req.body.size;
    const productImg = req.body.productImg;
    // Add a new category at level 1
    const level1Ref =  db.collection(category);
    const level1Id = await level1Ref.get();
    level1Id.forEach(doc=>{
      categoryId = doc.id
    })
    // Add a new category at level 2
    const level2Ref =  level1Ref.doc(categoryId).collection(subcategory);
    // const level2Id = level2Ref.id;
    const level2Id = await level2Ref.get();
    level2Id.forEach(doc=>{
      subcategoryId = doc.id
    })
    // Add a new category at level 3
    const level3Ref = await level2Ref.doc(subcategoryId).collection(subsubcategory).add({  subsubcategoryimg:subsubcategoryimg,title:title,size:size,name:subsubcategory,productImg:productImg });
    const level3Id = level3Ref.id;

    res.status(201).json({ level1Id, level2Id, level3Id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add product' });
  }
});
app.get('/getcatimg',async(req,res)=>{
  try {
    const collections = await db.listCollections();
    // Loop through each collection and get the first document
    const data = [];
    for (const collectionRef of collections) {
      const querySnapshot = await collectionRef.limit(1).get();
      const docSnapshot = querySnapshot.docs[0];
      if (docSnapshot) {
        data.push({
          collection: collectionRef.id,
          data: docSnapshot.data().categoryimg,
        });
      }
    }
    res.json(data);
  } catch (error) {
    res.status(500).send(error)
  }
})
app.get('/getsubcat/:categoryName',async(req,res)=>{
  try {
    let collectionId =" ";    
    const categoryName = req.params.categoryName;
    // Get a reference to the specified collection
    const collectionRef = db.collection(categoryName);
    const data = await collectionRef.get();
    data.forEach(doc =>{      
        collectionId = doc.id;      
    })
    // Get all subcollections within the specified collection
    const subcollections = await collectionRef.doc(collectionId).listCollections();
    console.log(subcollections)
    // Get the first document from each subcollection
    const subcollectionDocs = await Promise.all(
      subcollections.map(async (subcollectionRef) => {
        const snapshot = await subcollectionRef.limit(1).get();
        const doc = snapshot.docs[0];
        if (!doc) {
          return null;
        }
        return {
          name: doc.data().name,
          img: doc.data().subcategoryimg
        };
      })
    );

    res.json(subcollectionDocs.filter((doc) => doc !== null));
  } catch (error) {
    res.status(500).send(error)
  }
})
app.get('/getsubsubcat/:categoryName/:subcategoryName',async(req,res)=>{
  try {
    let collectionId =" ";    
    let subcollectionId =" ";    
    const categoryName = req.params.categoryName;
    const subcategoryName =req.params.subcategoryName;
    // Get a reference to the specified collection
    const collectionRef = db.collection(categoryName);
    const data = await collectionRef.get();
    data.forEach(doc =>{      
        collectionId = doc.id;      
    })
    const subcollectionRef = db.collection(categoryName).doc(collectionId).collection(subcategoryName);
    const sdata = await subcollectionRef.get();
    sdata.forEach(doc =>{      
        subcollectionId = doc.id;      
    })
    // Get all subcollections within the specified collection
    const subcollections = await subcollectionRef.doc(subcollectionId).listCollections();
    // Get the first document from each subcollection
    const subcollectionDocs = await Promise.all(
      subcollections.map(async (subcollectionRef) => {
        const snapshot = await subcollectionRef.limit(1).get();
        const doc = snapshot.docs[0];
        if (!doc) {
          return null;
        }
        return {
          name: doc.data().name,
          img: doc.data().subsubcategoryimg
        };
      })
    );

    res.json(subcollectionDocs.filter((doc) => doc !== null));
  } catch (error) {
    res.status(500).send(error)
  }
})
app.get('/products/:categoryName/:subcategoryName/:subsubcategoryName', async (req, res) => {
  try {
    let categoryId =" ";    
    let subcategoryId =" ";    
    const categoryName = req.params.categoryName;
    const subcategoryName =req.params.subcategoryName;
    const subsubcategoryName = req.params.subsubcategoryName;
    // Get a reference to the specified collection
    const collectionRef = db.collection(categoryName);
    const data = await collectionRef.get();
    data.forEach(doc =>{      
      categoryId = doc.id;      
    })
    const subcollectionRef = db.collection(categoryName).doc(categoryId).collection(subcategoryName);
    const sdata = await subcollectionRef.get();
    sdata.forEach(doc =>{      
      subcategoryId = doc.id;      
    })

    const categoryRef = db.collection(categoryName).doc(categoryId);
    const categoryDoc = await categoryRef.get();

    if (!categoryDoc.exists) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const subcategoryRef = categoryRef.collection(subcategoryName).doc(subcategoryId);
    const subcategoryDoc = await subcategoryRef.get();

    if (!subcategoryDoc.exists) {
      res.status(404).json({ error: 'Subcategory not found' });
      return;
    }

    const productsRef = subcategoryRef.collection(subsubcategoryName);
    const productsQuerySnapshot = await productsRef.get();

    const products = [];
    productsQuerySnapshot.forEach((doc) => {
      const productData = doc.data();
      const product = {
        id: doc.id,
        title:doc.data().title,
        size:doc.data().size
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
    