import "@testing-library/jest-dom";
import { useContext } from "react";
import { NotificationProvider, NotificationContext } from "../NotificationContext";

import { act, render, screen } from "@testing-library/react";

// Mocking React components and hooks
jest.mock("react", () => {
  const originalReact = jest.requireActual("react");
  return {
    ...originalReact,
    useContext: jest.fn((context) => {
      // If it's the NotificationContext, return a mock implementation
      if (context === originalReact.createContext()) {
        return {
          notifications: [],
          showNotification: jest.fn(),
          dismissNotification: jest.fn(),
        };
      }
      // Otherwise, use the original implementation
      return originalReact.useContext(context);
    }),
  };
});

describe("NotificationProvider() NotificationProvider method", () => {
  let mockUseContext: jest.Mock;

  beforeEach(() => {
    mockUseContext = useContext as jest.Mock;
  });

  describe("Happy Paths", () => {
    it("should add a notification and display it", () => {
      // Arrange
      const notification = {
        type: "success",
        title: "Success",
        message: "This is a success message",
        duration: 5000,
      };

      const TestComponent = () => {
        const { showNotification, notifications } = useContext(
          NotificationContext
        )!;
        return (
          <div>
            <button onClick={() => showNotification(notification)}>
              Show Notification
            </button>
            {notifications.map((notif) => (
              <div key={notif.id}>
                <h1>{notif.title}</h1>
                <p>{notif.message}</p>
              </div>
            ))}
          </div>
        );
      };

      // Act
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>,
      );

      act(() => {
        screen.getByText("Show Notification").click();
      });

      // Assert
      expect(screen.getByText("Success")).toBeInTheDocument();
      expect(screen.getByText("This is a success message")).toBeInTheDocument();
    });

    it("should remove a notification after its duration", () => {
      // Arrange
      jest.useFakeTimers();
      const notification = {
        type: "info",
        title: "Info",
        message: "This is an info message",
        duration: 1000,
      };

      const TestComponent = () => {
        const { showNotification, notifications } = useContext(
          NotificationContext
        )!;
        return (
          <div>
            <button onClick={() => showNotification(notification)}>
              Show Notification
            </button>
            {notifications.map((notif) => (
              <div key={notif.id}>
                <h1>{notif.title}</h1>
                <p>{notif.message}</p>
              </div>
            ))}
          </div>
        );
      };

      // Act
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>,
      );

      act(() => {
        screen.getByText("Show Notification").click();
      });

      // Assert
      expect(screen.getByText("Info")).toBeInTheDocument();
      expect(screen.getByText("This is an info message")).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(screen.queryByText("Info")).not.toBeInTheDocument();
      expect(
        screen.queryByText("This is an info message"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle dismissing a non-existent notification gracefully", () => {
      // Arrange
      const TestComponent = () => {
        const { dismissNotification } = useContext(NotificationContext)!;
        return (
          <div>
            <button onClick={() => dismissNotification("non-existent-id")}>
              Dismiss Notification
            </button>
          </div>
        );
      };

      // Act
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>,
      );

      act(() => {
        screen.getByText("Dismiss Notification").click();
      });

      // Assert
      // No error should be thrown, and nothing should be displayed
      expect(screen.queryByText("Dismiss Notification")).toBeInTheDocument();
    });

    it("should handle adding a notification with no duration", () => {
      // Arrange
      const notification = {
        type: "warning",
        title: "Warning",
        message: "This is a warning message",
      };

      const TestComponent = () => {
        const { showNotification, notifications } = useContext(
          NotificationContext
        )!;
        return (
          <div>
            <button onClick={() => showNotification(notification)}>
              Show Notification
            </button>
            {notifications.map((notif) => (
              <div key={notif.id}>
                <h1>{notif.title}</h1>
                <p>{notif.message}</p>
              </div>
            ))}
          </div>
        );
      };

      // Act
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>,
      );

      act(() => {
        screen.getByText("Show Notification").click();
      });

      // Assert
      expect(screen.getByText("Warning")).toBeInTheDocument();
      expect(screen.getByText("This is a warning message")).toBeInTheDocument();
    });
  });
});
