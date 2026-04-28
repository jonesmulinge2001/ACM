/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import * as mammoth from 'mammoth';
import * as https from 'https';
import { PrismaClient } from 'generated/prisma';
// replace the import * as pdfParse line with this:
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

import * as http from 'http';
const pdfParse = async (buffer: Buffer): Promise<{ text: string }> => {
  const pdfjsLib = require('pdfjs-dist');
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => item.str).join(' ') + '\n';
  }
  return { text };
};

interface ModerationResult {
  isAcademic: boolean;
  confidence: number;
  flaggedKeywords: string[];
  reason: string;
}

interface ClassificationResult {
  course: string | null;
  level: string | null;
  subject: string | null;
  tags: string[];
  summary?: string;
}

const ACADEMIC_KEYWORDS = [
  'abstract',
  'introduction',
  'methodology',
  'conclusion',
  'references',
  'bibliography',
  'theorem',
  'definition',
  'lemma',
  'proof',
  'corollary',
  'hypothesis',
  'experiment',
  'analysis',
  'results',
  'discussion',
  'research',
  'findings',
  'equation',
  'algorithm',
  'model',
  'framework',
  'examination',
  'university',
  'question',
  'marks',
  'degree',
  'bachelor',
  'explain',
  'describe',
  'discuss',
  'evaluate',
  'distinguish',
  'justify',
  'assignment',
  'answer',
  'instructions',
  'course',
  'stream',
  'entrepreneur',
];

const FLAGGED_KEYWORDS = [
  'porn',
  'xxx',
  'nude',
  'sex',
  'gambling',
  'casino',
  'drug',
  'cocaine',
  'meth',
];

@Injectable()
export class ProcessingService {
  private readonly logger = new Logger(ProcessingService.name);
  private prisma = new PrismaClient();

  // ─────────────────────────────────────────────
  // ENTRY POINT
  // ─────────────────────────────────────────────
  async processResource(resourceId: string) {
    console.log('PROCESS STARTED', resourceId);
    this.logger.log(`Processing started: ${resourceId}`);

    try {
      await this.updateStatus(resourceId, 'EXTRACTING');

      const { text, fileType } = await this.extractText(resourceId);

      await this.updateStatus(resourceId, 'MODERATING');
      const moderation = await this.moderateContent(resourceId, text);

      await this.updateStatus(resourceId, 'CLASSIFYING');
      await this.classifyResource(resourceId, text);

      await this.prisma.academicResource.update({
        where: { id: resourceId },
        data: {
          isApproved: moderation.isAcademic,
          approvedAt: moderation.isAcademic ? new Date() : null,
        },
      });

      await this.updateStatus(resourceId, 'DONE');

      this.logger.log(`Processing completed: ${resourceId}`);
    } catch (error) {
      this.logger.error(`Processing failed: ${resourceId}`, error);

      await this.prisma.academicResourceProcessing.update({
        where: { resourceId },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : String(error),
          finishedAt: new Date(),
        },
      });
    }
  }

  // ─────────────────────────────────────────────
  // STATUS
  // ─────────────────────────────────────────────
  private async updateStatus(
    resourceId: string,
    status:
      | 'EXTRACTING'
      | 'MODERATING'
      | 'CLASSIFYING'
      | 'SUMMARIZING'
      | 'DONE',
  ) {
    await this.prisma.academicResourceProcessing.update({
      where: { resourceId },
      data: {
        status,
        ...(status === 'EXTRACTING' && { startedAt: new Date() }),
        ...(status === 'DONE' && { finishedAt: new Date() }),
      },
    });
  }

  // ─────────────────────────────────────────────
  // STEP 1: TEXT EXTRACTION (FIXED)
  // ─────────────────────────────────────────────
  private async extractText(
    resourceId: string,
  ): Promise<{ text: string; fileType: string }> {
    const resource = await this.prisma.academicResource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) throw new Error('Resource not found');
    if (!resource.fileUrl) throw new Error('Missing file URL');

    const fileType = resource.fileType;

    if (!fileType) {
      throw new Error('Missing file type in database');
    }

    const buffer = await this.downloadFile(resource.fileUrl);
    this.logger.log(`🔥 FILE TYPE FROM DB: ${resource.fileType}`);
    this.logger.log(`🔥 FILE URL: ${resource.fileUrl}`);

    let text = '';

    //  USE MIME TYPE (NOT URL EXTENSION)
    switch (fileType) {
      case 'application/pdf': {
        const data = await pdfParse(buffer);
        text = data.text;
        break;
      }

      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
        break;
      }

      case 'text/plain': {
        text = buffer.toString('utf-8');
        break;
      }

      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    const cleaned = text.trim();

    if (!cleaned) {
      throw new Error('Extracted text is empty (likely scanned PDF)');
    }

    const wordCount = cleaned.split(/\s+/).length;

    await this.prisma.academicResourceExtraction.upsert({
      where: { resourceId },
      update: { rawText: cleaned, wordCount },
      create: { resourceId, rawText: cleaned, wordCount },
    });

    return { text: cleaned, fileType };
  }

  // ─────────────────────────────────────────────
  // DOWNLOAD FILE
  // ─────────────────────────────────────────────
  private downloadFile(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      const chunks: Buffer[] = [];

      protocol.get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to download file: HTTP ${res.statusCode}`));
          return;
        }

        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      });
    });
  }

  // ─────────────────────────────────────────────
  // MODERATION (Gemini)
  // ─────────────────────────────────────────────
  private async moderateContent(
    resourceId: string,
    text: string,
  ): Promise<ModerationResult> {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `Analyze this document and respond with ONLY a JSON object, no markdown, no explanation.

{
  "isAcademic": true or false,
  "confidence": number between 0 and 1,
  "flaggedKeywords": array of concerning words found or empty array,
  "reason": "brief one sentence reason"
}

Rules:
- isAcademic = true if it looks like lecture notes, exam paper, assignment, research, or study material
- flaggedKeywords should contain any pornographic, violent, or drug-related terms found
- if flaggedKeywords is not empty, isAcademic must be false

Document (first 1500 chars):
${text.slice(0, 1500)}`;

      const result = await model.generateContent(prompt);
      const raw = result.response.text().trim();

      // Strip markdown code fences if present
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      const modResult: ModerationResult = {
        isAcademic: Boolean(parsed.isAcademic),
        confidence: Number(parsed.confidence) || 0,
        flaggedKeywords: Array.isArray(parsed.flaggedKeywords)
          ? parsed.flaggedKeywords
          : [],
        reason: String(parsed.reason) || 'AI-based analysis',
      };

      await this.saveModeration(resourceId, modResult);
      return modResult;
    } catch (error) {
      this.logger.error(
        'Gemini moderation failed, falling back to keywords',
        error,
      );
      return this.keywordModerate(resourceId, text);
    }
  }

  // ─────────────────────────────────────────────
  // CLASSIFICATION (Gemini)
  // ─────────────────────────────────────────────
  private async classifyResource(resourceId: string, text: string) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const prompt = `Analyze this academic document and respond with ONLY a JSON object, no markdown, no explanation.

{
  "subject": "main subject/course name or null",
  "difficulty": "primary_school or high_school or undergraduate or postgraduate or null",
  "tags": ["array", "of", "relevant", "topic", "tags"]
}

Rules:
- subject should be the academic subject e.g. "Data Mining", "Computer Science", "Mathematics"
- difficulty based on the complexity and level of the content
- tags should be specific topics covered e.g. ["machine learning", "clustering", "algorithms"]
- maximum 6 tags

Document (first 1500 chars):
${text.slice(0, 1500)}`;

      const result = await model.generateContent(prompt);
      const raw = result.response.text().trim();
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      await this.prisma.academicResourceClassification.upsert({
        where: { resourceId },
        update: {
          subject: parsed.subject ?? null,
          difficulty: parsed.difficulty ?? null,
          tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        },
        create: {
          resourceId,
          subject: parsed.subject ?? null,
          difficulty: parsed.difficulty ?? null,
          tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        },
      });

      this.logger.log(`Classified resource ${resourceId} via Gemini`);
    } catch (error) {
      this.logger.error('Gemini failed:', error instanceof Error ? error.message : String(error));
      return this.keywordModerate(resourceId, text);
    }
  }

  // ─────────────────────────────────────────────
  // KEYWORD FALLBACKS (in case Gemini fails)
  // ─────────────────────────────────────────────
  private async keywordModerate(
    resourceId: string,
    text: string,
  ): Promise<ModerationResult> {
    const lower = text.toLowerCase();
    const normalized = lower.replace(/[^\w\s]/g, '');

    const flagged = FLAGGED_KEYWORDS.filter((keyword) =>
      new RegExp(`\\b${keyword}\\b`, 'i').test(normalized),
    );

    if (flagged.length > 0) {
      const result = {
        isAcademic: false,
        confidence: 0.95,
        flaggedKeywords: flagged,
        reason: `Flagged content: ${flagged.join(', ')}`,
      };
      await this.saveModeration(resourceId, result);
      return result;
    }

    const matched = ACADEMIC_KEYWORDS.filter((k) => lower.includes(k));
    const confidence = Math.min(
      (matched.length / ACADEMIC_KEYWORDS.length) * 1.5,
      1,
    );
    const result = {
      isAcademic: confidence > 0.25,
      confidence: Number(confidence.toFixed(2)),
      flaggedKeywords: [],
      reason: 'Keyword-based analysis (fallback)',
    };
    await this.saveModeration(resourceId, result);
    return result;
  }

  private async keywordClassify(resourceId: string, text: string) {
    const lower = text.toLowerCase();
    const subjectPatterns = [
      /bachelor of ([\w\s]+)/i,
      /course[:\s]+([\w\s]{3,30})/i,
      /department of ([\w\s]+)/i,
    ];
    let subject: string | null = null;
    for (const pattern of subjectPatterns) {
      const match = text.match(pattern);
      if (match) {
        subject = match[1].trim();
        break;
      }
    }
    const tagKeywords = [
      'entrepreneurship',
      'computer science',
      'innovation',
      'business',
      'technology',
      'management',
      'economics',
      'engineering',
      'mathematics',
    ];
    const tags = tagKeywords.filter((k) => lower.includes(k));
    const difficulty =
      lower.includes('degree') || lower.includes('university')
        ? 'undergraduate'
        : lower.includes('diploma')
          ? 'high_school'
          : null;

    await this.prisma.academicResourceClassification.upsert({
      where: { resourceId },
      update: { subject, tags, difficulty },
      create: { resourceId, subject, tags, difficulty },
    });
  }

  private async saveModeration(resourceId: string, result: ModerationResult) {
    await this.prisma.academicResourceModeration.upsert({
      where: { resourceId },
      update: result,
      create: { resourceId, ...result },
    });
  }

  private async generateSummary(resourceId: string, text: string) {
    // 🔹 For now (simple version)
    const sentences = text.split('.').filter((s) => s.length > 40);

    const summary = sentences.slice(0, 5).join('. ');

    const keyPoints = sentences.slice(0, 3);

    await this.prisma.academicResourceSummary.upsert({
      where: { resourceId },
      update: {
        summary,
        keyPoints,
      },
      create: {
        resourceId,
        summary,
        keyPoints,
      },
    });

    this.logger.log(`Summary generated for ${resourceId}`);
  }
}
