const express = require('express');
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
require("dotenv").config();

// middleware
app.use(cors());
app.use(express.json());

app.get("/",(req,res)=>{
    res.send("volunteer server is running")
})
// volunteerDB
// lgLieCYvx8ZsO3rp


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.a5mfktt.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const jwtVerify = (req,res,next)=>{
    const authorization = req.headers.authorization;
    if(!authorization){
        return res.status(401).send({error:true,message:"unauthorized access"})
    }
    const token = authorization.split(' ')[1]
    jwt.verify(token,process.env.ACCESS_SECRET_TOKEN,(error,decoded)=>{
        if(error){
            return res.status(403).send({error:true,message:"unauthorized access"})
        }
        req.decoded = decoded;
        next()
    })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const clientsCollection = client.db("volunteerDB").collection("clients");
    const bookingsCollection = client.db("volunteerDB").collection("bookings")
    const volunteersCollection = client.db("volunteerDB").collection("volunteers")

    // for tokens


    app.post("/token",async(req,res)=>{
        const user = req.body;
        const token = jwt.sign(user,process.env.ACCESS_SECRET_TOKEN,{expiresIn: "30d"});
        res.send({token});
    })

    // clients

    app.get("/totalClients", async(req,res)=>{
        const result = await clientsCollection.estimatedDocumentCount();
        res.send({totalStock: result})
    })

    app.get("/clients", async(req,res)=>{
        const page = parseInt(req.query.page) || 0;
        const limit = parseInt(req.query.size) || 10;
        const skip = page * limit;
        const result = await clientsCollection.find().skip(skip).limit(limit).toArray();
        res.send(result);
    })

    app.get("/clients/:id",async(req,res)=>{
        const id = req.params.id;
        const query = {_id : new ObjectId(id)}
        const result = await clientsCollection.findOne(query);
        res.send(result);
    })

    app.post("/clients", async(req,res)=>{
        const newClient = req.body;
        console.log(newClient)
    })

    // for searching

    app.get("/searchclients",async(req,res)=>{
        console.log(req.query)
        let filter = {};
        if(req.query?.name){
            filter = {name: req.query?.name.split("-").join(" ")}
        }
        const result = await clientsCollection.find(filter).toArray();
        res.send(result);
    })

    // booking 
    app.get("/bookings",jwtVerify,async(req,res)=>{
        const decoded = req.decoded;
        if(decoded.email !== req.query.email){
            return res.status(403).send({error:1,message:"forbidden access"})
        }
        let filter = {};
        if(req.query?.email){
            filter={email:req.query?.email}
        }
        const result = await bookingsCollection.find(filter).toArray();
        res.send(result)
    })

    app.post("/bookings",async(req,res)=>{
        const booking = req.body;
        const result = await bookingsCollection.insertOne(booking);
        res.send(result);
    })

    app.patch("/bookings/:id", async(req,res)=>{
        const id = req.params.id;
        const booking = req.body;
        const query = {_id : new ObjectId(id)};
        const updatedDoc = {
            $set:{
                status: booking.status
            }
        }
        const result = await bookingsCollection.updateOne(query,updatedDoc)
        res.send(result);
    })

    app.delete("/bookings/:id",async(req,res)=>{
        const id = req.params.id;
        console.log(id)
        const query = { _id : new ObjectId(id)}
        const result = await bookingsCollection.deleteOne(query);
        res.send(result);
    })

    // volunteers

    app.get("/volunteers",async(req,res)=>{
        const result = await volunteersCollection.find().toArray();
        res.send(result)
    })

    app.post("/volunteers",async(req,res)=>{
        const volunteer = req.body;
        console.log(volunteer);
        const result = await volunteersCollection.insertOne(volunteer);
        res.send(result);
    })

    app.delete("/volunteers/:id",async(req,res)=>{
        const id = req.params.id;
        const query = {_id : new ObjectId(id)}
        const result = await volunteersCollection.deleteOne(query);
        res.send(result);
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



app.listen(port,()=>{
    console.log(`server is running port: ${port}`)
})
