process.env.NEXT_PUBLIC_API_URL = "http://localhost:8000";
import "@testing-library/jest-dom";

jest.mock("next-intl", () => ({
  NextIntlClientProvider: ({ children }: { children: unknown }) => children,
  useTranslations: () => (key: string) => key,
  useLocale: () => "es",
  useFormatter: () => ({
    number: (value: number) => String(value),
    dateTime: (value: Date) => String(value),
  }),
}));
