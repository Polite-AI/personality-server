module.exports = {
    apps: [{
        name: "personality-server",
        script: "./index.js",
        watch: false,
        instances: 3,
        env_production: {
            NODE_ENV: "production"
        }
    }]
};