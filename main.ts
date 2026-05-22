    if (!appPin) {
      console.error("APP_PIN not configured");
      return false;
    }
    return args.pin === appPin;
    const adminPin = process.env.APP_PIN;
    const studentPin = process.env.STUDENT_PIN;
    if (adminPin && args.pin === adminPin) return "admin";
    if (studentPin && args.pin === studentPin) return "student";
    return null;
  },
});

export const sendMessage = action({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: recipientEmail,
          subject: `[ZŠ Labská] ${args.subject}`,
          subject: `[ZS Alexandra I.] ${args.subject}`,
          message,
          chatId,
          appName,
          secretKey,
        }),
      });

      if (res.status === 402) {
        return { ok: false, error: "Nedostatek kreditů" };
      }
      if (!res.ok) {
        const text = await res.text();
        console.error("Email API error:", text);
        return { ok: false, error: "Chyba při odesílání" };
      }
      console.log("Email sent successfully to", recipientEmail);
      return { ok: true };
    } catch (err) {
      console.error("Email fetch error:", err);
      return { ok: false, error: String(err) };
    }
  },
});
