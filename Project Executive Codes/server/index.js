import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { User, Booking, Flight } from './schemas.js';

const app = express();

app.use(express.json());
app.use(bodyParser.json({limit: "30mb", extended: true}))
app.use(bodyParser.urlencoded({limit: "30mb", extended: true}));
app.use(cors());

// mongoose setup

const PORT = 6001;
mongoose.connect('mongodb://localhost:27017/flightfinder', { 
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }
).then(()=>{

    // All the client-server activites
    // 🚀 Auto Seed Flights for 30 Days
const cities = ["Hyderabad", "Banglore", "Mumbai", "Delhi", "Chennai", "Kolkata", "Pune", "Trivendrum", "Indore", "Jaipur"];

const getRandomTime = () => {
  const hour = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const minute = String(Math.floor(Math.random() * 60)).padStart(2, '0');
  return `${hour}:${minute}`;
};

const seedFlights = async () => {
  const today = new Date();
  const flights = [];

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const formattedDate = date.toISOString().split('T')[0];

    for (let j = 0; j < 5; j++) {
      const origin = cities[Math.floor(Math.random() * cities.length)];
      let destination;
      do {
        destination = cities[Math.floor(Math.random() * cities.length)];
      } while (destination === origin);

      flights.push({
        flightName: `Flight ${origin}-${destination}-${i + 1}-${j + 1}`,
        flightId: `F${i + 1}${j + 1}`,
        origin,
        destination,
        departureTime: getRandomTime(),
        arrivalTime: getRandomTime(),
        departureDate: formattedDate,
        basePrice: Math.floor(Math.random() * 3000 + 1000),
        totalSeats: 60
      });
    }
  }

  const count = await Flight.countDocuments();
  if (count === 0) {
    await Flight.insertMany(flights);
    console.log("✅ 30 days of flights inserted successfully.");
  } else {
    console.log("ℹ️ Flights already exist. Skipping seeding.");
  }
};

seedFlights(); // 👈 Call this once at startup



    app.post('/register', async (req, res) => {
        const { username, email, usertype, password } = req.body;
        let approval = 'approved';
        try {
          
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'User already exists' });
            }

            if(usertype === 'flight-operator'){
                approval = 'not-approved'
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new User({
                username, email, usertype, password: hashedPassword, approval
            });
            const userCreated = await newUser.save();
            return res.status(201).json(userCreated);

        } catch (error) {
          console.log(error);
          return res.status(500).json({ message: 'Server Error' });
        }
    });

    app.post('/login', async (req, res) => {
        const { email, password } = req.body;
        try {

            const user = await User.findOne({ email });
    
            if (!user) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid email or password' });
            } else{
                
                return res.json(user);
            }
          
        } catch (error) {
          console.log(error);
          return res.status(500).json({ message: 'Server Error' });
        }
    });
      

    // Approve flight operator

    app.post('/approve-operator', async(req, res)=>{
        const {id} = req.body;
        try{
            
            const user = await User.findById(id);
            user.approval = 'approved';
            await user.save();
            res.json({message: 'approved!'})
        }catch(err){
            res.status(500).json({ message: 'Server Error' });
        }
    })

    // reject flight operator

    app.post('/reject-operator', async(req, res)=>{
        const {id} = req.body;
        try{
            
            const user = await User.findById(id);
            user.approval = 'rejected';
            await user.save();
            res.json({message: 'rejected!'})
        }catch(err){
            res.status(500).json({ message: 'Server Error' });
        }
    })


    // fetch user

    app.get('/fetch-user/:id', async (req, res)=>{
        const id = await req.params.id;
        console.log(req.params.id)
        try{
            const user = await User.findById(req.params.id);
            console.log(user);
            res.json(user);

        }catch(err){
            console.log(err);
        }
    })

    // fetch all users

    app.get('/fetch-users', async (req, res)=>{

        try{
            const users = await User.find();
            res.json(users);

        }catch(err){
            res.status(500).json({message: 'error occured'});
        }
    })


    // Add flight

    app.post('/add-flight', async (req, res)=>{
        const {flightName, flightId, origin, destination, departureTime, 
                                arrivalTime, basePrice, totalSeats} = req.body;
        try{

            const flight = new Flight({flightName, flightId, origin, destination, 
                                        departureTime, arrivalTime, basePrice, totalSeats});
            const newFlight = flight.save();

            res.json({message: 'flight added'});

        }catch(err){
            console.log(err);
        }
    })

    // update flight
    
    app.put('/update-flight', async (req, res)=>{
        const {_id, flightName, flightId, origin, destination, 
                    departureTime, arrivalTime, basePrice, totalSeats} = req.body;
        try{

            const flight = await Flight.findById(_id)

            flight.flightName = flightName;
            flight.flightId = flightId;
            flight.origin = origin;
            flight.destination = destination;
            flight.departureTime = departureTime;
            flight.arrivalTime = arrivalTime;
            flight.basePrice = basePrice;
            flight.totalSeats = totalSeats;

            const newFlight = flight.save();

            res.json({message: 'flight updated'});

        }catch(err){
            console.log(err);
        }
    })

    // fetch flights

    app.get('/fetch-flights', async (req, res)=>{
        
        try{
            const flights = await Flight.find();
            res.json(flights);

        }catch(err){
            console.log(err);
        }
    })


    // fetch flight

    app.get('/fetch-flight/:id', async (req, res)=>{
        const id = await req.params.id;
        console.log(req.params.id)
        try{
            const flight = await Flight.findById(req.params.id);
            console.log(flight);
            res.json(flight);

        }catch(err){
            console.log(err);
        }
    })

    // fetch all bookings

    app.get('/fetch-bookings', async (req, res)=>{
        
        try{
            const bookings = await Booking.find();
            res.json(bookings);

        }catch(err){
            console.log(err);
        }
    })

    // Book ticket

    app.post('/book-ticket', async (req, res)=>{
        const {user, flight, flightName, flightId,  departure, destination, 
                    email, mobile, passengers, totalPrice, journeyDate, journeyTime, seatClass} = req.body;
        try{
            const bookings = await Booking.find({flight: flight, journeyDate: journeyDate, seatClass: seatClass});
            const numBookedSeats = bookings.reduce((acc, booking) => acc + booking.passengers.length, 0);
            
            let seats = "";
            const seatCode = {'economy': 'E', 'premium-economy': 'P', 'business': 'B', 'first-class': 'A'};
            let coach = seatCode[seatClass];
            for(let i = numBookedSeats + 1; i< numBookedSeats + passengers.length+1; i++){
                if(seats === ""){
                    seats = seats.concat(coach, '-', i);
                }else{
                    seats = seats.concat(", ", coach, '-', i);
                }
            }
            const booking = new Booking({user, flight, flightName, flightId, departure, destination, 
                                            email, mobile, passengers, totalPrice, journeyDate, journeyTime, seatClass, seats});
            await booking.save();

            res.json({message: 'Booking successful!!'});
        }catch(err){
            console.log(err);
        }
    })


    // cancel ticket

    app.put('/cancel-ticket/:id', async (req, res)=>{
        const id = await req.params.id;
        try{
            const booking = await Booking.findById(req.params.id);
            booking.bookingStatus = 'cancelled';
            await booking.save();
            res.json({message: "booking cancelled"});

        }catch(err){
            console.log(err);
        }
    })






        app.listen(PORT, ()=>{
            console.log(`Running @ ${PORT}`);
        });
    }
).catch((e)=> console.log(`Error in db connection ${e}`));