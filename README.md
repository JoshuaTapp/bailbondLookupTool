# NC DOI Bail Bondsman License Lookup Tool

This web-based tool lets you look up bail bondsman license information by entering an NPN or scanning a QR code on an ID card.

## How to Use
1. Enter the NPN in the text field and click **Lookup by NPN**, or click **Scan QR Code** to scan an ID card.  
2. If valid, license details (status, photo, etc.) appear in the results section.  

## Running Locally on Port 8100
Open your terminal in the project folder and run:
```bash
python -m http.server 8100
```
Then go to:
```
http://localhost:8100/
```
in your browser.

(Alternatively, if you have Node.js installed, you can install `http-server` globally and run:
```bash
http-server -p 8100
```
Then open the same URL.)

## Deployment (Azure Static Web Apps)
1. Create a new Azure Static Web Apps resource in the Azure portal.  
2. Deploy this entire folder (including `bailbondLookupTool.html`).  
3. Configure any build settings if needed (not necessary for simple static files).  
4. The app is then hosted at the URL provided by Azure Static Web Apps.

## API Calls
This tool calls:
```
https://our.ncdoi.com/bailbond;rev=2/agent_info/{NPN}
```
The API returns JSON with license details for the given NPN.  
Error messages display if the NPN is invalid or the service is unavailable.  
