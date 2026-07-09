const fs = require('fs');
const path = require('path');
const https = require('https');

const jsonPath = path.join(__dirname, '../../../test_files/buyers_100_seed.json');
const csvPath = path.join(__dirname, '../../../test_files/buyers_100_seed.csv');
const credentialsPath = path.join(__dirname, '../../../test_files/buyers_100_ethereal_credentials.json');

function createEtherealAccount() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      requestor: 'spoiler-alert-' + Math.random().toString(36).substring(2),
      version: '1.0'
    });
    const req = https.request('https://api.nodemailer.com/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 10000
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        } else {
          reject(new Error(`Ethereal API returned status ${res.statusCode}: ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    req.write(postData);
    req.end();
  });
}

async function getUniqueEtherealAccount(retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await createEtherealAccount();
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

async function main() {
  if (!fs.existsSync(jsonPath)) {
    console.error('buyers_100_seed.json does not exist. Run generate100Buyers.js first.');
    process.exit(1);
  }

  const buyers = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Registering unique Ethereal accounts for ${buyers.length} buyers...`);

  const credentialsList = [];
  const usedEmails = new Set();

  for (let i = 0; i < buyers.length; i++) {
    const buyer = buyers[i];
    let account;
    try {
      account = await getUniqueEtherealAccount();
      while (usedEmails.has(account.user)) {
        account = await getUniqueEtherealAccount();
      }
      usedEmails.add(account.user);

      buyer.email = account.user;
      buyer.password = account.pass;
      buyer.etherealWebmail = `https://ethereal.email/login`;

      credentialsList.push({
        id: i + 1,
        companyName: buyer.companyName,
        tier: buyer.tier,
        email: account.user,
        password: account.pass,
        smtpHost: account.smtp.host,
        smtpPort: account.smtp.port,
        imapHost: account.imap.host,
        imapPort: account.imap.port,
        webmailUrl: 'https://ethereal.email/login'
      });

      console.log(`[${i + 1}/${buyers.length}] Created unique Ethereal account for ${buyer.companyName}: ${account.user}`);
    } catch (err) {
      console.error(`Failed for ${buyer.companyName}:`, err.message);
      process.exit(1);
    }
    await new Promise(res => setTimeout(res, 50));
  }

  console.log(`\nVerification: Generated ${usedEmails.size} unique emails for ${buyers.length} buyers.`);

  // Save updated buyers_100_seed.json
  fs.writeFileSync(jsonPath, JSON.stringify(buyers, null, 2));

  // Save updated buyers_100_seed.csv
  const csvHeaders = ['companyName', 'email', 'password', 'tier', 'isVerified', 'acceptsShortDated', 'minShelfLife', 'categories', 'transportRadius', 'latitude', 'longitude', 'excludedAllergens'];
  const csvRows = [csvHeaders.join(',')];

  buyers.forEach(b => {
    const row = [
      `"${b.companyName.replace(/"/g, '""')}"`,
      `"${b.email}"`,
      `"${b.password}"`,
      `"${b.tier}"`,
      b.isVerified,
      b.acceptsShortDated,
      b.minShelfLife,
      `"${b.categories.join(';')}"`,
      b.transportRadius,
      b.warehouseLocations[0].lat,
      b.warehouseLocations[0].lng,
      `"${b.excludedAllergens.join(';')}"`
    ];
    csvRows.push(row.join(','));
  });

  fs.writeFileSync(csvPath, csvRows.join('\n'));

  // Save dedicated credentials file
  fs.writeFileSync(credentialsPath, JSON.stringify(credentialsList, null, 2));

  console.log('\n--- SUCCESS ---');
  console.log(`Updated JSON with passwords: ${jsonPath}`);
  console.log(`Updated CSV with passwords: ${csvPath}`);
  console.log(`Created Ethereal Credentials file: ${credentialsPath}`);
}

main().catch(err => {
  console.error('Fatal error during Ethereal registration:', err);
  process.exit(1);
});

