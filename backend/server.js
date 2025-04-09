const express = require('express');
const app = express();
const path = require(`path`);
const axios = require("axios");
const cors = require("cors");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');

const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://jiayaow:TbLf4zqvuV9jUZAT@cluster0.ftnid.mongodb.net/HW3?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);
let db;
async function mongodb() {
    try {
        await client.connect();
        db = client.db("HW3");
        console.log("Successfully connected to MongoDB!");
    } catch (err) {
        console.error("MongoDB error:", err);
        process.exit(1);
    }
}
mongodb();


// app.use(express.json()); app.use(cors({
//     origin: 'http://192.168.0.18:4200',
//     credentials: true
// }));
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'https://csci571-jiayaohw3.wl.r.appspot.com',
  credentials: true
}));
app.use(express.static(path.join(__dirname, "static")));

const CLIENT_ID = "c0fdf49a1be57c78d460";
const CLIENT_SECRET = "22fe60cb19626ed42295bb39f81a03ed";
let token = null;
let expireTime = null;

const frontend = path.join(__dirname, '/static');

app.use(express.static(frontend));


app.get("/images/:filename", (req, res) => {
    res.sendFile(path.join(__dirname, "/static/assets", "images", req.params.filename));
});

async function getXappToken() {
    const now = new Date();
    if (token && expireTime && new Date(expireTime) > now) {
        return { expires_at: expireTime, token, type: "xapp_token" };
    }
    try {
        const response = await axios.post("https://api.artsy.net/api/tokens/xapp_token", {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET
        });

        if (response.status === 201) {
            token = response.data.token;
            expireTime = response.data.expires_at;
        }
    } catch (error) {
        console.error("Fetching error:", error);
        return res.json({ error });
    }
}


app.get("/search/:search_content", async (req, res) => {
    const searchContent = req.params.search_content;
    if (!searchContent) {
        return res.json({ error: "Missing search content" });
    }

    try {
        await getXappToken();
        const response = await axios.get("https://api.artsy.net/api/search", {
            params: { q: searchContent, size: 10, type: "artist" },
            headers: { "X-XAPP-Token": token },
        });

        if (response.status === 200) {
            const results = response.data._embedded.results.map((elem) => ({
                title: elem.title || "",
                link: elem._links?.self?.href?.split("/").pop() || "",
                image: elem._links?.thumbnail?.href || ""
            }));

            return res.json({ results });
        }
    } catch (error) {
        return res.json({ error });
    }
});

app.get("/similar_artists/:id", async (req, res) => {
    const artistId = req.params.id;
    if (!artistId) {
        return res.json({ error: "Missing artist ID" });
    }

    try {
        await getXappToken();
        const response = await axios.get(`https://api.artsy.net/api/artists`, {
            params: { similar_to_artist_id: artistId },
            headers: { "X-XAPP-Token": token },
        });

        if (response.status === 200) {
            const artists = response.data._embedded?.artists || [];
            const results = artists.map((artist) => ({
                title: artist.name || "",
                link: artist.id || "",
                image: artist._links?.thumbnail?.href || "",
            }));

            return res.json({ results });
        }
    } catch (error) {
        return res.json({ error });
    }
});

app.get("/artists/:id", async (req, res) => {
    const artistId = req.params.id;
    if (!artistId) {
        return res.json({ error: "Missing artist ID" });
    }

    try {
        await getXappToken();
        const response = await axios.get(`https://api.artsy.net/api/artists/${artistId}`, {
            headers: { "X-XAPP-Token": token },
        });
        if (response.status === 200) {
            const data = response.data;
            return res.json({
                name: data.name || "",
                birthday: data.birthday || "",
                deathday: data.deathday || "",
                nationality: data.nationality || "",
                biography: data.biography || "",
                image: data._links?.thumbnail?.href || "",
                id: artistId,
            });
        }
    } catch (error) {
        return res.json({ error });
    }
});

app.get("/artworks/:id", async (req, res) => {
    const artistId = req.params.id;
    if (!artistId) {
        return res.json({ error: "Missing artist ID" });
    }

    try {
        await getXappToken();
        const response = await axios.get(`https://api.artsy.net/api/artworks`, {
            params: { artist_id: artistId, size: 10 },
            headers: { "X-XAPP-Token": token },
        });
        if (response.status === 200) {
            const results = response.data._embedded.artworks.map((elem) => ({
                id: elem.id || "",
                title: elem.title || "",
                date: elem.date || "",
                image: elem._links?.thumbnail?.href || ""
            }));
            return res.json({ results });
        }
    } catch (error) {
        return res.json({ error });
    }
});

app.get("/genes/:id", async (req, res) => {
    const artworkId = req.params.id;
    if (!artworkId) {
        return res.json({ error: "Missing artist ID" });
    }

    try {
        await getXappToken();
        const response = await axios.get(`https://api.artsy.net/api/genes`, {
            params: { artwork_id: artworkId },
            headers: { "X-XAPP-Token": token },
        });
        if (response.status === 200) {
            const results = response.data._embedded.genes.map((elem) => ({
                name: elem.name || "",
                image: elem._links?.thumbnail?.href || ""
            }));
            return res.json({ results });
        }
    } catch (error) {
        return res.json({ error });
    }
});

app.post('/register', async (req, res) => {
    const { fullname, email, password } = req.body;

    const favorite = db.collection("favorites");

    if (await favorite.findOne({ email })) {
        return res.status(409).json({ field: 'email', message: 'User with this email already exists.' });
    }

    const bcryptPassword = await bcrypt.hash(password, 10);
    const shaEmail = crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
    const image = `https://www.gravatar.com/avatar/${shaEmail}`;
    const favorites = [];
    const token = jwt.sign({ email }, 'your_jwt_secret', { expiresIn: '1h' });

    await favorite.insertOne({ fullname, email, password: bcryptPassword, image, favorites });

    res.cookie('token', token, {
        httpOnly: true,
        maxAge: 3600000,
        sameSite: 'Lax'
    });

    res.status(201).json({ message: 'Registered successfully', image, fullname, email });
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const favorite = await db.collection("favorites").findOne({ email });
        if (!favorite) return res.status(404).json({ message: 'Password or email is incorrect.' });
        const passtrue = await bcrypt.compare(password, favorite.password);
        if (!passtrue) {
            return res.status(401).json({ field: 'password', message: 'Password or email is incorrect.' });
        }

        const token = jwt.sign({ email }, 'your_jwt_secret', { expiresIn: '1h' });

        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 3600000,
            sameSite: 'Lax'
        });
        res.json({
            fullname: favorite.fullname,
            image: favorite.image,
            email: favorite.email,
            favorites: favorite.favorites.sort((a, b) => new Date(b.time) - new Date(a.time)),
        });
    } catch (err) {
        console.log(err);
        return res.status(401).json({ message: 'Password or email is incorrect.' });
    }
});

app.post('/delete', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        console.log(email);
        return res.status(400).json({ error: 'Delete failed' });
    }
    try {
        const haveAccount = await db.collection("favorites").findOne({ email });
        if (!haveAccount) {
            return res.status(404).json({ error: 'User not found' });
        }
        await db.collection("favorites").deleteOne({ email });

        res.clearCookie('token');
        res.status(200).json({ message: 'Account deleted' });
    } catch (err) {
        res.status(401).json({ error: 'Delete Failed' });
    }
});

app.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ message: 'Log out successfully.' });
});

app.post('/add_favorite', async (req, res) => {
    const { id, email } = req.body;
    if (!id || !email) {
        return res.status(400).json({ message: 'Failed to add.' });
    }

    try {
        const users = db.collection("favorites");
        const existingUser = await users.findOne({ email, "favorites.id": id });
        if (existingUser) {
            return res.status(200).json({
                favorites: existingUser.favorites,
                message: 'Already in favorites',
                type: 'info'
            });
        }
        await getXappToken();
        const response = await axios.get(`https://api.artsy.net/api/artists/${id}`, {
            headers: { "X-XAPP-Token": token },
        });
        if (response.status !== 200 || !response.data) {
            return res.status(500).json({ message: 'Failed to fetch artist info.' });
        }
        const artist = response.data;
        const newFavorite = {
            id,
            name: artist.name || '',
            birthday: artist.birthday || '',
            deathday: artist.deathday || '',
            nationality: artist.nationality || '',
            image: artist._links?.thumbnail?.href || '',
            time: new Date().toISOString()
        };
        await users.updateOne(
            { email },
            { $push: { favorites: newFavorite } },
            { upsert: true }
          );

        const updatedUser = await users.findOne({ email });
        return res.status(200).json({ favorites: updatedUser?.favorites.sort((a, b) => new Date(b.time) - new Date(a.time)) || [], message: 'Added to favorites', type: 'success' });
    } catch (err) {
        console.error('Error adding favorite:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});
app.post('/remove_favorite', async (req, res) => {
    const { id, email } = req.body;
    if (!id || !email) {
        return res.status(400).json({ message: 'Failed to remove.' });
    }

    try {
        const users = db.collection("favorites");

        await users.updateOne(
            { email },
            { $pull: { favorites: { id } } }
        );
        const updatedUser = await users.findOne({ email });
        const sortedFavorites = (updatedUser?.favorites || []).sort((a, b) => new Date(b.time) - new Date(a.time));
        return res.status(200).json({ favorites: sortedFavorites || [], message: 'Removed from favorites', type: 'danger' });
    } catch (err) {
        console.error('Error removing favorite:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});
app.get('/me', (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'No token.' });

    try {
        const tokenVerify = jwt.verify(token, 'your_jwt_secret');
        const email = tokenVerify.email;

        db.collection("favorites").findOne({ email }).then(favorite => {
            if (!favorite) return res.status(404).json({ error: 'User not found' });

            res.json({
                fullname: favorite.fullname,
                image: favorite.image,
                email: favorite.email,
                favorites: favorite.favorites.sort((a, b) => new Date(b.time) - new Date(a.time)),
            });
        });
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
});


app.get('/', (req, res) => {
    res.sendFile(path.join(frontend, 'index.html'));
});
const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });