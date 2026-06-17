import { Resend } from "resend";

const resend = new Resend("re_b7Nf2KRc_BKMREzFZHkPHpYrHy2J2A7Hr");

async function testEmail() {
  try {
    const data = await resend.emails.send({
      from: "CarpenterBullet <no-reply@carpenterbullet.com>",
      to: "rajacofficial369@gmail.com",
      subject: "Test from CarpenterBullet",
      html: "<h2>If you are reading this, the Resend configuration works perfectly!</h2><p>This is a live test from your local environment.</p>"
    });
    console.log("Success! Email sent. Response:", data);
  } catch (error) {
    console.error("Failed to send email:");
    console.error(error);
  }
}

testEmail();
