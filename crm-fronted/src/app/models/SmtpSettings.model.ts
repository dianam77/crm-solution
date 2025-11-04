export interface SmtpSettings {
  id?: number; 
  displayName: string;
  smtpServer: string;
  smtpPort: number;
  senderEmail: string;
  senderPassword: string;
  enableSsl: boolean;
  isActive: boolean;
}
