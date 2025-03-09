const express = require('express');
const app = express();
const path = require(`path`);
const axios = require("axios");
const cors = require("cors");

app.use(cors());
app.use(express.static(path.join(__dirname, "static")));

const CLIENT_ID = "c0fdf49a1be57c78d460";
const CLIENT_SECRET = "22fe60cb19626ed42295bb39f81a03ed";
let token = null;
let expireTime = null;


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "index.html"));
});

app.get("/images/:filename", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "images", req.params.filename));
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
            return response.data;
        }
    } catch (error) {
        console.error("Error fetching XAPP token:", error);
    }

    return { expires_at: expireTime, token, type: "xapp_token" };
}


app.get("/search/:search_content", async (req, res) => {
    const searchContent = req.params.search_content;
    if (!searchContent) {
        return res.json({ error: "Missing search content" });
    }
    const tokenData = await getXappToken();

    try {
        const response = await axios.get("https://api.artsy.net/api/search", {
            params: { q: searchContent, size: 10, type: "artist" },
            headers: { "X-XAPP-Token": tokenData.token },
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
        return res.json({ error: "Wrong response status", data: error.response?.data || error.message });
    }
});

app.get("/artists/:id", async (req, res) => {
    const artistId = req.params.id;
    if (!artistId) {
        return res.json({ error: "Missing artist ID" });
    }
    const tokenData = await getXappToken();

    try {
        const response = await axios.get(`https://api.artsy.net/api/artists/${artistId}`, { 
            headers: { "X-XAPP-Token": tokenData.token }, 
        });
        if (response.status === 200) {
            const data = response.data;
            return res.json({
                name: data.name || "",
                birthday: data.birthday || "",
                deathday: data.deathday || "",
                nationality: data.nationality || "",
                biography: data.biography || ""
            });
        }
    } catch (error) {
        return res.json({ error: "Wrong response status", data: error.response?.data || error.message });
    }
});


// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});