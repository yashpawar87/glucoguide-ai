def calculate_adherence(log):

    score = 0
    total = 0

    if log.exercise_minutes is not None:
        total += 1
        if log.exercise_minutes >= 30:
            score += 1

    if log.sleep_hours is not None:
        total += 1
        if 7 <= log.sleep_hours <= 8:
            score += 1

    if log.alcohol_units is not None:
        total += 1
        if log.alcohol_units <= 1:
            score += 1

    if log.fasting_glucose is not None:
        total += 1
        if log.fasting_glucose <= 110:
            score += 1

    if log.diet_score is not None:
        total += 1
        if log.diet_score >= 7:
            score += 1

    if total == 0:
        return 0

    return round((score / total) * 100, 2)
