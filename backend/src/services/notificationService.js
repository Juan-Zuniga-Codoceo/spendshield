const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');
const Debt = require('../models/Debt');
const User = require('../models/User');

class NotificationService {
  constructor() {
    console.log('Inicializando NotificationService...');
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  async checkUpcomingDebts() {
    try {
      console.log('Iniciando verificación de deudas...');
      
      const currentDate = new Date();
      const fiveDaysFromNow = new Date();
      fiveDaysFromNow.setDate(currentDate.getDate() + 5);
      
      // Buscar tanto deudas regulares como indefinidas
      const debts = await Debt.find({
        isPaid: false,
        $or: [
          // Deudas regulares próximas a vencer
          {
            isIndefinite: false,
            dueDate: {
              $gte: currentDate,
              $lte: fiveDaysFromNow
            }
          },
          // Deudas indefinidas que necesitan recordatorio
          {
            isIndefinite: true,
            $or: [
              { lastReminderSent: null },
              {
                lastReminderSent: {
                  $lt: this.getLastReminderThreshold(currentDate)
                }
              }
            ]
          }
        ]
      });

      console.log('Deudas encontradas:', debts.length);

      for (const debt of debts) {
        const user = await User.findById(debt.user);
        if (!user) {
          console.log('Usuario no encontrado para la deuda:', debt._id);
          continue;
        }

        console.log('Procesando deuda para usuario:', user.email);

        const shouldNotify = await this.shouldSendNotification(debt, currentDate);
        if (!shouldNotify) {
          console.log('No es necesario enviar notificación para la deuda:', debt._id);
          continue;
        }

        // Crear el mensaje apropiado según el tipo de deuda
        const notificationData = this.createNotificationMessage(debt, currentDate);

        // Crear notificación en la base de datos
        const notification = new Notification({
          user: user._id,
          title: notificationData.title,
          message: notificationData.message,
          type: 'debt',
          relatedId: debt._id
        });
        await notification.save();
        console.log('Notificación creada:', notification._id);

        // Enviar email
        await this.sendEmail(
          user.email,
          notificationData.emailSubject,
          this.createEmailContent(user.name, debt, notificationData)
        );

        // Actualizar fecha del último recordatorio
        await Debt.findByIdAndUpdate(debt._id, {
          lastReminderSent: currentDate
        });
      }
    } catch (error) {
      console.error('Error en checkUpcomingDebts:', error);
    }
  }

  getLastReminderThreshold(currentDate) {
    const threshold = new Date(currentDate);
    threshold.setDate(threshold.getDate() - this.getReminderInterval());
    return threshold;
  }

  getReminderInterval(frequency = 'WEEKLY') {
    switch (frequency) {
      case 'DAILY':
        return 1;
      case 'WEEKLY':
        return 7;
      case 'MONTHLY':
        return 30;
      default:
        return 7;
    }
  }

  async shouldSendNotification(debt, currentDate) {
    if (debt.isIndefinite) {
      if (!debt.lastReminderSent) return true;

      const interval = this.getReminderInterval(debt.reminderFrequency);
      const threshold = new Date(currentDate);
      threshold.setDate(threshold.getDate() - interval);
      
      return debt.lastReminderSent < threshold;
    } else {
      const existingNotification = await Notification.findOne({
        relatedId: debt._id,
        type: 'debt',
        isDismissed: false,
        createdAt: { $gte: new Date(currentDate.getTime() - 24 * 60 * 60 * 1000) }
      });

      return !existingNotification;
    }
  }

  createNotificationMessage(debt, currentDate) {
    if (debt.isIndefinite) {
      return {
        title: 'Recordatorio de Deuda Recurrente',
        message: `Recordatorio de pago para tu deuda "${debt.description}" por $${debt.amount.toLocaleString()}.`,
        emailSubject: 'Recordatorio de Deuda Recurrente - SpendShield'
      };
    } else {
      const daysUntilDue = Math.ceil((debt.dueDate - currentDate) / (1000 * 60 * 60 * 24));
      return {
        title: 'Deuda Próxima a Vencer',
        message: `Tu deuda "${debt.description}" por $${debt.amount.toLocaleString()} vence en ${daysUntilDue} días.`,
        emailSubject: 'Recordatorio de Deuda Próxima a Vencer - SpendShield'
      };
    }
  }

  createEmailContent(userName, debt, notificationData) {
    const baseContent = `
      <h2>${notificationData.title}</h2>
      <p>Hola ${userName},</p>
      <p>${debt.isIndefinite ? 'Te recordamos sobre tu deuda recurrente:' : 'Te recordamos que tienes una deuda próxima a vencer:'}</p>
      <ul>
        <li><strong>Descripción:</strong> ${debt.description}</li>
        <li><strong>Monto:</strong> $${debt.amount.toLocaleString()}</li>
        <li><strong>Categoría:</strong> ${debt.category}</li>
        ${debt.isIndefinite ? 
          `<li><strong>Frecuencia de recordatorio:</strong> ${this.getFrequencyLabel(debt.reminderFrequency)}</li>` :
          `<li><strong>Fecha de vencimiento:</strong> ${new Date(debt.dueDate).toLocaleDateString()}</li>`
        }
      </ul>
      <p>Ingresa a SpendShield para ver más detalles.</p>
      <p>Saludos,<br>El equipo de SpendShield</p>
    `;

    return baseContent;
  }

  getFrequencyLabel(frequency) {
    const labels = {
      'DAILY': 'Diario',
      'WEEKLY': 'Semanal',
      'MONTHLY': 'Mensual'
    };
    return labels[frequency] || 'Semanal';
  }

  async sendEmail(to, subject, htmlContent) {
    try {
      console.log('Intentando enviar email a:', to);
      const mailOptions = {
        from: `SpendShield <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html: htmlContent
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email enviado exitosamente:', info.response);
      return info;
    } catch (error) {
      console.error('Error enviando email:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();