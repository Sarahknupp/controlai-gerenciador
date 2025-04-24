import axios from 'axios';
import { parse as parseOFX } from 'ofx-js';
import { parse as parseCNAB } from 'cnab';

interface BankCredentials {
  bank: 'nubank' | 'bancodobrasil' | 'bradesco' | 'stone';
  clientId: string;
  clientSecret: string;
  certificateKey?: string;
}

interface Transaction {
  date: Date;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  balance?: number;
  id: string;
}

class BankIntegration {
  private credentials: BankCredentials;
  private tokens: Record<string, string> = {};

  constructor(credentials: BankCredentials) {
    this.credentials = credentials;
  }

  private async getNubankToken(): Promise<string> {
    try {
      const response = await axios.post('https://prod-auth.nubank.com.br/token', {
        grant_type: 'client_credentials',
        client_id: this.credentials.clientId,
        client_secret: this.credentials.clientSecret,
      });

      return response.data.access_token;
    } catch (error) {
      throw new Error('Failed to authenticate with Nubank');
    }
  }

  private async getBancoDoBrasilToken(): Promise<string> {
    try {
      const response = await axios.post('https://oauth.bb.com.br/oauth/token', {
        grant_type: 'client_credentials',
        client_id: this.credentials.clientId,
        client_secret: this.credentials.clientSecret,
      });

      return response.data.access_token;
    } catch (error) {
      throw new Error('Failed to authenticate with Banco do Brasil');
    }
  }

  private async getBradescoToken(): Promise<string> {
    try {
      const response = await axios.post('https://api.bradesco.com/oauth/token', {
        grant_type: 'client_credentials',
        client_id: this.credentials.clientId,
        client_secret: this.credentials.clientSecret,
      }, {
        headers: {
          'X-Brad-Certificate': this.credentials.certificateKey,
        }
      });

      return response.data.access_token;
    } catch (error) {
      throw new Error('Failed to authenticate with Bradesco');
    }
  }

  private async getStoneToken(): Promise<string> {
    try {
      const response = await axios.post('https://api.stone.com.br/api/v1/token', {
        client_id: this.credentials.clientId,
        client_secret: this.credentials.clientSecret,
      });

      return response.data.access_token;
    } catch (error) {
      throw new Error('Failed to authenticate with Stone');
    }
  }

  private async getToken(): Promise<string> {
    if (this.tokens[this.credentials.bank]) {
      return this.tokens[this.credentials.bank];
    }

    let token: string;

    switch (this.credentials.bank) {
      case 'nubank':
        token = await this.getNubankToken();
        break;
      case 'bancodobrasil':
        token = await this.getBancoDoBrasilToken();
        break;
      case 'bradesco':
        token = await this.getBradescoToken();
        break;
      case 'stone':
        token = await this.getStoneToken();
        break;
      default:
        throw new Error('Unsupported bank');
    }

    this.tokens[this.credentials.bank] = token;
    return token;
  }

  async getTransactions(startDate: Date, endDate: Date): Promise<Transaction[]> {
    const token = await this.getToken();

    switch (this.credentials.bank) {
      case 'nubank': {
        const response = await axios.get('https://prod-api.nubank.com.br/transactions', {
          headers: { Authorization: `Bearer ${token}` },
          params: { start_date: startDate.toISOString(), end_date: endDate.toISOString() }
        });
        return this.formatNubankTransactions(response.data);
      }

      case 'bancodobrasil': {
        const response = await axios.get('https://api.bb.com.br/banking/v2/transactions', {
          headers: { Authorization: `Bearer ${token}` },
          params: { startDate: startDate.toISOString(), endDate: endDate.toISOString() }
        });
        return this.formatBBTransactions(response.data);
      }

      case 'bradesco': {
        const response = await axios.get('https://api.bradesco.com/v1/accounts/transactions', {
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Brad-Certificate': this.credentials.certificateKey 
          },
          params: { initialDate: startDate.toISOString(), finalDate: endDate.toISOString() }
        });
        return this.formatBradescoTransactions(response.data);
      }

      case 'stone': {
        const response = await axios.get('https://api.stone.com.br/api/v1/transactions', {
          headers: { Authorization: `Bearer ${token}` },
          params: { from: startDate.toISOString(), to: endDate.toISOString() }
        });
        return this.formatStoneTransactions(response.data);
      }

      default:
        throw new Error('Unsupported bank');
    }
  }

  async importOFXFile(fileContent: string): Promise<Transaction[]> {
    try {
      const parsed = await parseOFX(fileContent);
      return this.formatOFXTransactions(parsed);
    } catch (error) {
      throw new Error('Failed to parse OFX file');
    }
  }

  async importCNABFile(fileContent: string): Promise<Transaction[]> {
    try {
      const parsed = await parseCNAB(fileContent);
      return this.formatCNABTransactions(parsed);
    } catch (error) {
      throw new Error('Failed to parse CNAB file');
    }
  }

  private formatNubankTransactions(data: any): Transaction[] {
    return data.map((transaction: any) => ({
      date: new Date(transaction.postDate),
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.amount > 0 ? 'credit' : 'debit',
      id: transaction.id
    }));
  }

  private formatBBTransactions(data: any): Transaction[] {
    return data.transactions.map((transaction: any) => ({
      date: new Date(transaction.transactionDate),
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type === 'CREDIT' ? 'credit' : 'debit',
      balance: transaction.balance,
      id: transaction.id
    }));
  }

  private formatBradescoTransactions(data: any): Transaction[] {
    return data.map((transaction: any) => ({
      date: new Date(transaction.date),
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type === 'C' ? 'credit' : 'debit',
      balance: transaction.balance,
      id: transaction.id
    }));
  }

  private formatStoneTransactions(data: any): Transaction[] {
    return data.map((transaction: any) => ({
      date: new Date(transaction.created_at),
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type === 'credit' ? 'credit' : 'debit',
      id: transaction.id
    }));
  }

  private formatOFXTransactions(data: any): Transaction[] {
    return data.transactions.map((transaction: any) => ({
      date: new Date(transaction.date),
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.amount > 0 ? 'credit' : 'debit',
      id: transaction.id
    }));
  }

  private formatCNABTransactions(data: any): Transaction[] {
    return data.map((transaction: any) => ({
      date: new Date(transaction.date),
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type === 'credit' ? 'credit' : 'debit',
      id: transaction.id
    }));
  }
}

export default BankIntegration;