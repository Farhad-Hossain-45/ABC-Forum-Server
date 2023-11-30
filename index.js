const express = require('express');
const app = express()
const cors = require('cors');
const jwt = require('jsonwebtoken');
const stripe = require("stripe")(process.env.SECRET_STRIPE_KEY);
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000

// middleware

app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.exa7jan.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const userCollection = client.db('forumDB').collection('users')
    const postCollection = client.db('forumDB').collection('post')

    // jwt related api

    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.send({ token })
    })
    // custom middleware
    const verifyToken = (req,res,next)=>{
      console.log('inside verify token', req.headers.authorization)
      if(!req.headers. authorization){
        return res.status(401).send({message: 'forbidden access'})
      }
      const token = req.headers.authorization.split(' ')[1]
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
        if(err){
          return res.status(401).send({message: 'forbidden access'})
        }
        req.decoded = decoded
        next()
    
      })
      
    }
    app.get('/post', async (req, res) => {
      const result = await postCollection.find().toArray()
      res.send(result)
    })
    app.get('/users', async (req, res) => {
      const result = await userCollection.find().toArray()
      res.send(result)
    })

    app.get('/post/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await postCollection.findOne(query)
      res.send(result)
    })

    app.get('/users/admin/:email', async(req,res)=>{
      const email = req.params.email
      // if(email !== req.decoded.email ){
      //   return res.status(403).send({message: 'unauthorized access'})
        
      // }
      const query = {email: email}
        const user = await userCollection.findOne(query)
        let admin = false;
        if(user){
          admin = user?.role === 'admin'
        }
        res.send({admin})
    })

    app.post('/users', async (req, res) => {
      const newUser = req.body
      const query = { email: newUser.email }
      const existingUser = await userCollection.findOne(query)
      if (existingUser) {
        return res.send({ message: 'user already exist', insertedId: null })
      }
      console.log(newUser)
      const result = await userCollection.insertOne(newUser)
      res.send(result)
    })
    app.post('/post', async (req, res) => {
      const newPost = req.body
      console.log(newPost)
      const result = await postCollection.insertOne(newPost)
      res.send(result)
    })
    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await userCollection.deleteOne(query)
      res.send(result)
    })

    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

  app.post("/create-payment-intent", async (req, res) =>{
    const {price} = req.body;
    const amount = parseInt(price * 100);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "usd",
      payment_method_type: ['card']
    });
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('final assignment is running')
})

app.listen(port, () => {
  console.log(`final assignment is running on port ${port}`)
})