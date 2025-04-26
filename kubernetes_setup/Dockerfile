FROM dorowu/ubuntu-desktop-lxde-vnc

# Install Google Chrome
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
    echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
    google-chrome-stable \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Uninstall existing Flask and Werkzeug
RUN pip3 uninstall -y flask werkzeug

# Copy nginx SSL configuration
COPY nginx-ssl.conf /etc/nginx/conf.d/default.conf

COPY requirements.txt /app/
RUN pip3 install --no-cache-dir -r /app/requirements.txt

# Copy Flask app
COPY app.py /app/
WORKDIR /app

# Create SSL directory
RUN mkdir -p /etc/nginx/ssl

# Add Flask app to supervisord configuration
RUN echo "[program:flask]\ncommand=python3 /app/app.py\nautostart=true\nautorestart=true\nstdout_logfile=/var/log/flask.log\nstderr_logfile=/var/log/flask.err.log" > /etc/supervisor/conf.d/flask.conf

# Use the default CMD from the base image
