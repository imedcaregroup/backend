import { log } from "winston";

export class RemainingSlotsService {
  private dateParameters: any;
  private entityParameters: any;

  public setDateParameters(month: number | null, year: number | null): void {
    const today = new Date();

    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    this.dateParameters = {
      month: month || currentMonth,
      year: year || currentYear,
    };
  }

  public setEntityParameters(
    medicalId: number | null,
    employeeId: number | null,
  ): void {
    this.entityParameters = {
      medicalId,
      employeeId,
    };
  }

  public async getSlots(): Promise<Array<any>> {
    this.ensurePassedMedicalOrEmployee();

    const orders = await this.getOrdersByChosenMonth();
    const bookedSlots = this.groupBookedSlots(orders);
    const availableSlots = await this.getAvailableSlots();

    return this.getRemainingDays(bookedSlots, availableSlots);
  }

  private getRemainingDays(
    bookedSlotsByDate: any,
    availableSlots: any,
  ): Array<any> {
    const remainingDays = [];
    const now = new Date();

    for (let day = 1; day <= this.getLastDayOfMonth(); day++) {
      if (this.isPastDayOfCurrentMonth(day)) continue;

      const date = new Date(
        this.getChosenYear(),
        this.getChosenMonth() - 1,
        day,
        0,
        0,
        0,
      );
      const dateString = this.toIsoPreservingLocal(date).split("T")[0];
      const slotDay = date.getDay() - 1 < 0 ? 6 : date.getDay() - 1;

      // Filter slots for this day of week
      const availableSlotsForDate = availableSlots.filter(
        (slot: any) => slot.day === slotDay,
      );

      // Remove booked slots
      const bookedSlotsOnDate = bookedSlotsByDate[dateString];

      const distinctAvailableSlotsForDate = this.distinctByStartTime(
        availableSlotsForDate,
      );

      const remainingSlots = distinctAvailableSlotsForDate.filter(
        (slot: any) =>
          !bookedSlotsOnDate?.[String(slot.startTime)] ||
          (bookedSlotsOnDate?.[String(slot.startTime)] &&
            bookedSlotsOnDate?.[String(slot.startTime)] >=
              availableSlotsForDate.filter(
                (availableSlot: any) =>
                  availableSlot.startTime === slot.startTime,
              ).length),
      );

      // Current-day additional filtering
      const filteredSlots = this.isToday(day)
        ? remainingSlots.filter((slot: any) => {
            const currentTime = now.getHours() * 100 + now.getMinutes();
            return slot.startTime > currentTime;
          })
        : remainingSlots;

      remainingDays.push({
        day: date.toLocaleString("default", { weekday: "long" }),
        date: dateString,
        remainingSlotsCount: filteredSlots.length,
        remainingSlots: filteredSlots
          .map((slot: any) => ({
            remainingPlaces:
              availableSlotsForDate.filter(
                (availableSlot: any) =>
                  availableSlot.startTime === slot.startTime,
              ).length - (bookedSlotsOnDate?.[String(slot.startTime)] || 0),
            startTime: slot.startTime,
            displayTime: this.formatTime(slot.startTime),
          }))
          .filter((slot: any) => slot.remainingPlaces > 0),
      });
    }

    return remainingDays;
  }

  private async getOrdersByChosenMonth(): Promise<any> {
    let whereParts: any = {};

    if (this.isBothChosenMedicalAndEmployee()) {
      whereParts = {
        medicalId: this.entityParameters.medicalId,
        employeeId: this.entityParameters.employeeId,
      };
    } else if (this.entityParameters.medicalId) {
      whereParts = {
        medicalId: this.entityParameters.medicalId,
        employeeId: null,
      };
    } else {
      whereParts = {
        employeeId: this.entityParameters.employeeId,
      };
    }

    return await __db.order.findMany({
      where: {
        ...whereParts,
        orderDate: {
          gte: new Date(this.getChosenYear(), this.getChosenMonth() - 1, 1),
          lte: new Date(
            this.getChosenYear(),
            this.getChosenMonth() - 1,
            this.getLastDayOfMonth(),
          ),
        },
        OR: [{ orderStatus: "pending" }, { orderStatus: "accepted" }],
      },
      select: {
        orderDate: true,
        startTime: true,
      },
    });
  }

  private groupBookedSlots(orders: Array<any>): any {
    const bookedSlotsByDate: { [key: string]: { [key: string]: number } } = {};

    orders.forEach((order) => {
      const dateKey = this.toIsoPreservingLocal(order.orderDate).split("T")[0];

      if (!bookedSlotsByDate[dateKey]) {
        bookedSlotsByDate[dateKey] = {};
      }

      if (!bookedSlotsByDate[dateKey][String(order.startTime)]) {
        bookedSlotsByDate[dateKey][String(order.startTime)] = 0;
      }

      bookedSlotsByDate[dateKey][String(order.startTime)]++;
    });

    return bookedSlotsByDate;
  }

  private async getAvailableSlots(): Promise<any> {
    let whereParts: any = {};

    if (this.isBothChosenMedicalAndEmployee()) {
      whereParts.medicalId = this.entityParameters.medicalId;
      whereParts.employeeId = this.entityParameters.employeeId;
    } else if (this.entityParameters.medicalId) {
      whereParts.medicalId = this.entityParameters.medicalId;
      whereParts.employeeId = null;
    } else {
      whereParts.medicalId = null;
      whereParts.employeeId = this.entityParameters.employeeId;
    }

    return await __db.availability.findMany({
      where: {
        ...whereParts,
        day: { in: Array.from({ length: 7 }, (_, i) => i) },
      },
      select: {
        id: true,
        day: true,
        startTime: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });
  }

  private distinctByStartTime(arr: any): any {
    return Array.from(
      new Map(arr.map((item: any) => [item.startTime, item])).values(),
    );
  }

  private toIsoPreservingLocal(d: Date): string {
    const utcTs = Date.UTC(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      d.getHours(),
      d.getMinutes(),
      d.getSeconds(),
      d.getMilliseconds(),
    );

    return new Date(utcTs).toISOString();
  }

  private formatTime(time: number): string {
    const hours = Math.floor(time / 100);
    const minutes = time % 100;
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;
    return `${formattedHours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")} ${ampm}`;
  }

  private isBothChosenMedicalAndEmployee(): boolean {
    return this.entityParameters.medicalId && this.entityParameters.employeeId;
  }

  private ensurePassedMedicalOrEmployee(): void {
    if (!this.entityParameters.medicalId && !this.entityParameters.employeeId) {
      throw new Error(
        "You should pass one of the following cases: medicalId or employeeId with medicalId",
      );
    }
  }

  private isToday(day: number): boolean {
    const now: Date = new Date();
    const currentDay: number = now.getDate();
    const currentMonth: number = now.getMonth() + 1;
    const currentYear: number = now.getFullYear();

    return (
      this.getChosenYear() === currentYear &&
      this.getChosenMonth() === currentMonth &&
      day === currentDay
    );
  }

  private isPastDayOfCurrentMonth(day: number): boolean {
    const now = new Date();
    const currentDay: number = now.getDate();
    const currentMonth: number = now.getMonth() + 1;
    const currentYear: number = now.getFullYear();

    return (
      this.dateParameters.month === currentMonth &&
      this.dateParameters.year === currentYear &&
      day < currentDay
    );
  }

  private getLastDayOfMonth(): number {
    return new Date(
      this.dateParameters.year,
      this.dateParameters.month - 1,
      0,
    ).getDate();
  }

  private getChosenYear(): number {
    return this.dateParameters.year;
  }

  private getChosenMonth(): number {
    return this.dateParameters.month;
  }
}
