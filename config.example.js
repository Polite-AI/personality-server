const config = {
    "production": {
        "api": {
            "version": "1.0",
            "host": "api.polite.ai"
        },
        "behaviour":{
            "roomIdSalt":"SALTHERE",
            "listen":"8000"
        },
        "postgres": {
            "host": "HOST",
            "user": "USER",
            "password": "PASSWORD",
            "database": "DATABASE"
        }
    },
    "development": {
        "api": {
            "version": "1.0",
            "host": "api.polite.ai"
        },
        "behaviour":{
            "roomIdSalt":"SALTHERE",
            "listen":"8000"
        },
        "postgres": {
            "host": "HOST",
            "user": "USER",
            "password": "PASSWORD",
            "database": "DATABASE"
        }
    }
};

module.exports = config[process.env.NODE_ENV || 'development'];
