const express = require('express')
const { ObjectID } = require('bson')
const mongo = require('mongodb').MongoClient

const app = express()

const tripIdRegExp = new RegExp(/\/trips\/:(\w+)/)
const expenseIdRegExp = new RegExp(/\/expenses\/:(\w+)/)

app.use(express.json())

let db

mongo.connect('mongodb://localhost:27017', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }, (err, client) => {
    if (err) {
      return
    }
    db = client.db('tripcost')
  }
)

app.get('/trips', (req, res) => {
  const trips = db.collection('trips')
	trips.find().toArray((err, items) => {
    if (err) {
      res.status(400).json({ err })
      return
    }
    if (!items.length) {
      res.status(200).json({ findTrip: false })
      return
    }
    res.status(200).json({ items })
	})
})


app.get(tripIdRegExp, (req, res) => {
  const trips = db.collection('trips')
  const id = req.url.match(tripIdRegExp)
  trips.findOne({ '_id': ObjectID(id[1])}, (err, result) => {
    if(err) {
      res.status(400).json({ err })
      return
    }
    if(!result) {
      res.status(200).json({ findTrip: false })
      return
    }
    res.status(200).json({ ...result })
  })
})

app.post('/trips', (req, res) => {
  const trips = db.collection('trips')
  const name = req.body.name
  trips.insertOne({ name: name }, (err, result) => {
    if (err) {
      res.status(400).json({ err })
      return
    }
    if(!result) {
      res.status(200).json({ created: false })
      return
    }
    res.status(201).json({ ok: true })
  })
})

app.patch(tripIdRegExp, async (req, res) => {
  const newTrip = req.body
  const trips = db.collection('trips')
  const id = req.url.match(tripIdRegExp)
  console.log(ObjectID(id[1]))
  const trip = await trips.findOne({ '_id': ObjectID(id[1]) })
  if(!trip) {
    res.status(200).json({ findTrip: false })
    return
  }
  await trips.updateOne(trip, {$set:{ ...trip, ...newTrip }})
  res.status(200).json({ ok: true })
})

app.delete(tripIdRegExp, (req, res) => {
  const trips = db.collection('trips')
  const id = req.url.match(tripIdRegExp) 

  trips.deleteOne({ '_id': ObjectID(id[1]) }, (err, result) => {
    if(err) {
      res.status(400).json({ err })
      return
    }
    if(!result) {
      res.status(200).json({ findTrip: false })
      return
    }
    const expenses = db.collection('expenses')

    expenses.deleteMany({ trip: id[1] }, (err, result) => {
      if(err) {
        res.status(400).json({ err })
        return
      }
      res.status(204).json({})
    })
    
  })
})

app.get('/expenses', (req, res) => {
  const expenses = db.collection('expenses')
  expenses.find({trip: req.query.trip}).toArray((err, items) => {
    if (err) {
      res.status(400).json({ err })
      return
    }
    if(!items.length) {
      res.status(200).json({ findExpense: false })
      return
    }
    res.status(200).json({ expenses: items })
  })
})

app.get(expenseIdRegExp, (req, res) => {
  const expenses = db.collection('expenses')
  const id = req.url.match(expenseIdRegExp) 

  expenses.findOne({ '_id': ObjectID(id[1]) }, (err, result) => {
    if(err) {
      res.status(400).json({ err })
      return
    }
    if(!result) {
      res.status(200).json({ findExpense: false })
      return
    }
    res.status(200).json({ ...result })
  })
})

app.post('/expenses', (req, res) => {
  const expenses = db.collection('expenses')

  expenses.insertOne(
  {
    trip: req.body.trip,
    date: req.body.date,
    amount: req.body.amount,
    category: req.body.category,
    description: req.body.description
  },
  (err, result) => {
    if (err) {
      res.status(400).json({ err })
      return
    }
    if(!result) {
      res.status(200).json({ created: false })
      return
    }
    res.status(201).json({ ok: true })
  }
  )
})

app.patch(expenseIdRegExp, async(req, res) => {
  const expenses = db.collection('expenses')
  const id = req.url.match(expenseIdRegExp)
  const newExpense = req.body
  const expense = await expenses.findOne({ '_id': ObjectID(id[1]) })
  if(!expense) {
    res.status(200).json({ findExpense: false })
    return
  }
  await expenses.updateOne(expense, { $set: {...expense, ...newExpense }})
  res.status(200).json({ ok: true })
})

app.delete(expenseIdRegExp, (req, res) => {
  const expenses = db.collection('expenses')
  const id = req.url.match(expenseIdRegExp)

  expenses.deleteOne({ '_id': ObjectID(id[1]) }, (err, result) => {
    if(err) {
      res.status(400).json({ err })
      return
    }
    if(!result) {
      res.status(200).json({ findExpense: false })
      return
    }
    res.status(204).json({})
  })
})

app.listen(3000, () => console.log('Server is ready'))